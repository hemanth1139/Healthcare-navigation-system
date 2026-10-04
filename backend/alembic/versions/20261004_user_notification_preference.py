"""Persist the per-user notification preference.

Revision ID: 20261004_user_notifications
Revises: None
"""

from alembic import op
import sqlalchemy as sa


revision = "20261004_user_notifications"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("users") and not any(
        column["name"] == "enable_notifications"
        for column in inspector.get_columns("users")
    ):
        op.add_column(
            "users",
            sa.Column("enable_notifications", sa.Boolean(), nullable=False, server_default=sa.true()),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("users") and any(
        column["name"] == "enable_notifications"
        for column in inspector.get_columns("users")
    ):
        op.drop_column("users", "enable_notifications")
