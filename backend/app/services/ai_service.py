import hashlib
import json
import logging
import os
import time

from google import genai
from google.genai import types
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.orm import Session

from app.models.tables import AIAnalysisResult

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
AI_ANALYSIS_ENABLED = os.getenv("AI_ANALYSIS_ENABLED", "true").lower() == "true"

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not configured in environment variables.")

client = genai.Client(api_key=GEMINI_API_KEY)


class AIAnalysisResponse(BaseModel):
    issue: str = Field(min_length=1)
    severity: str = Field(min_length=1)
    explanation: str = Field(min_length=1)
    possible_cause: str = Field(min_length=1)
    recommendation: str = Field(min_length=1)


ALLOWED_SEVERITIES = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}

AI_SYSTEM_INSTRUCTION = """
You are an AI inventory and warehouse management diagnostic assistant.
Your role is STRICTLY analytical, diagnostic, advisory, and read-only.
You have NO ability to modify, create, delete, approve, or update records.
Never claim that you modified or changed a record.
Treat deterministic calculations as the source of truth.
Analyze only supplied context data and return only the requested structured response.
"""

CHAT_SYSTEM_INSTRUCTION = """
You are a read-only AI inventory and warehouse management assistant.
Answer questions using ONLY the supplied operational context.
Never perform or claim database mutations.
Do not invent inventory facts that are not present in the supplied context.
If the supplied context does not contain enough information to answer the question,
clearly say that the required information is not available.
"""


def _validate_analysis(data: AIAnalysisResponse) -> AIAnalysisResponse:
    severity = data.severity.strip().upper()

    if severity not in ALLOWED_SEVERITIES:
        raise ValueError(
            f"Invalid severity '{severity}'. Allowed: {sorted(ALLOWED_SEVERITIES)}"
        )

    data.severity = severity
    return data


def _generate_context_hash(context_data: dict) -> str:
    context_string = json.dumps(
        context_data,
        sort_keys=True,
        ensure_ascii=False,
        default=str,
    )

    return hashlib.sha256(
        context_string.encode("utf-8")
    ).hexdigest()


def _generate_content_with_retry(
    model: str,
    contents: str,
    config,
    max_retries: int = 3,
):
    last_exception = None

    for attempt in range(max_retries):
        try:
            return client.models.generate_content(
                model=model,
                contents=contents,
                config=config,
            )

        except Exception as exc:
            last_exception = exc
            error_text = str(exc).lower()

            retryable = any(
                keyword in error_text
                for keyword in [
                    "503",
                    "unavailable",
                    "high demand",
                    "temporarily",
                    "timeout",
                    "timed out",
                    "429",
                    "resource exhausted",
                ]
            )

            if not retryable or attempt == max_retries - 1:
                raise

            wait_time = 2 ** attempt

            logger.warning(
                "Gemini request failed. Retrying in %s seconds. Attempt %s/%s.",
                wait_time,
                attempt + 1,
                max_retries,
            )

            time.sleep(wait_time)

    raise last_exception


def analyze_and_persist_issue(
    db: Session,
    context_data: dict,
    scope: str = "inventory_reconciliation",
) -> AIAnalysisResponse | None:

    if not AI_ANALYSIS_ENABLED or not context_data:
        return None

    data_hash = _generate_context_hash(context_data)
    cache_scope = f"{scope}:{data_hash}"

    existing_cache = (
        db.query(AIAnalysisResult)
        .filter(AIAnalysisResult.scope == cache_scope)
        .first()
    )

    if existing_cache:
        try:
            cached_result = AIAnalysisResponse(
                issue=existing_cache.issue,
                severity=existing_cache.severity,
                explanation=existing_cache.explanation,
                possible_cause=existing_cache.possible_cause,
                recommendation=existing_cache.recommendation,
            )

            return _validate_analysis(cached_result)

        except (ValidationError, ValueError):
            pass

    try:
        serialized_context = json.dumps(
            context_data,
            ensure_ascii=False,
            default=str,
        )

    except (TypeError, ValueError):
        logger.exception("Failed to serialize AI analysis context.")
        return None

    prompt = f"""
Analyze the following deterministic inventory reconciliation context using only supplied facts:

{serialized_context}
"""

    try:
        response = _generate_content_with_retry(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=AI_SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=AIAnalysisResponse,
                temperature=0.2,
            ),
        )

    except Exception:
        logger.exception("Gemini analysis API request failed after retries.")
        return None

    if not response or not response.text:
        return None

    try:
        validated_data = AIAnalysisResponse.model_validate_json(
            response.text
        )

        validated_data = _validate_analysis(validated_data)

    except (ValidationError, ValueError):
        logger.exception(
            "Failed to validate Gemini JSON response."
        )
        return None

    try:
        db_result = AIAnalysisResult(
            scope=cache_scope,
            issue=validated_data.issue,
            severity=validated_data.severity,
            explanation=validated_data.explanation,
            possible_cause=validated_data.possible_cause,
            recommendation=validated_data.recommendation,
        )

        db.add(db_result)
        db.commit()
        db.refresh(db_result)

    except Exception:
        db.rollback()
        logger.exception(
            "Failed to persist AI analysis result."
        )
        return None

    return validated_data


def analyze_chat_question(
    question: str,
    context_data: dict,
) -> str | None:

    if not AI_ANALYSIS_ENABLED:
        return None

    if not question.strip() or not context_data:
        return None

    try:
        serialized_context = json.dumps(
            context_data,
            ensure_ascii=False,
            default=str,
        )

    except (TypeError, ValueError):
        logger.exception(
            "Failed to serialize AI chat context."
        )
        return None

    prompt = f"""
Operational inventory context:

{serialized_context}

User question:

{question}
"""

    try:
        response = _generate_content_with_retry(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=CHAT_SYSTEM_INSTRUCTION,
                temperature=0.2,
            ),
        )

    except Exception:
        logger.exception(
            "Gemini chat API request failed after retries."
        )
        return None

    if not response or not response.text:
        return None

    return response.text.strip()

