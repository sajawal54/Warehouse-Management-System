import json

from app.models.tables import AuditLog


def create_audit_log(
    db,
    user_id,
    action,
    entity,
    entity_id,
    before=None,
    after=None
):
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
        before=json.dumps(before) if before else None,
        after=json.dumps(after) if after else None
    )

    db.add(audit_log)