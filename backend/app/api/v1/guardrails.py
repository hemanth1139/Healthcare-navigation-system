"""
Guardrails Verification API Router.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any

from app.dependencies import DBSession, CurrentUser
from app.agents.guardrail_agent import GuardrailAgent

router = APIRouter(prefix="/guardrails", tags=["AI Input Guardrails"])


class GuardrailVerifyRequest(BaseModel):
    queryText: str


@router.post("", response_model=Dict[str, Any])
async def verify_query(
    payload: GuardrailVerifyRequest,
    db: DBSession,
    current_user: CurrentUser
):
    """Run guardrail validation check directly against a clinical input query."""
    return await GuardrailAgent.validate_query(payload.queryText)
