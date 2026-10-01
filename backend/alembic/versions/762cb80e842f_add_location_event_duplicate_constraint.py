"""add location event duplicate constraint

Revision ID: 762cb80e842f
Revises: e663d1167f01
Create Date: 2026-09-30 12:50:00.782833

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "762cb80e842f"
down_revision: Union[str, None] = "e663d1167f01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_location_event_duplicate",
        "location_events",
        [
            "device_id",
            "latitude",
            "longitude",
            "timestamp",
        ],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_location_event_duplicate",
        "location_events",
        type_="unique",
    )