from math import ceil

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.user import User
from app.schemas.device import DeviceCreate, DeviceUpdate
from app.services.audit_log_service import AuditLogService


class DeviceService:
    @staticmethod
    def create(
        db: Session,
        data: DeviceCreate,
    ) -> Device:
        user = db.scalar(
            select(User).where(
                User.id == data.user_id,
                User.is_active.is_(True),
            )
        )

        if user is None:
            raise ValueError(
                "Active user not found for the supplied user_id."
            )

        normalized_identifier = (
            data.device_identifier.strip()
        )

        existing_device = db.scalar(
            select(Device).where(
                Device.device_identifier
                == normalized_identifier
            )
        )

        if existing_device is not None:
            raise ValueError(
                "A device with this identifier already exists."
            )

        device = Device(
            user_id=data.user_id,
            device_identifier=normalized_identifier,
            name=data.name,
            is_active=True,
        )

        db.add(device)

        try:
            db.flush()

            AuditLogService.create_log(
                db=db,
                action="CREATE",
                entity_type="DEVICE",
                entity_id=device.id,
                details={
                    "user_id": device.user_id,
                    "device_identifier": device.device_identifier,
                    "name": device.name,
                    "is_active": device.is_active,
                },
            )

            db.commit()

        except IntegrityError:
            db.rollback()
            raise ValueError(
                "A device with this identifier already exists."
            )

        db.refresh(device)

        return device

    @staticmethod
    def get_by_id(
        db: Session,
        device_id: int,
    ) -> Device | None:
        return db.scalar(
            select(Device).where(Device.id == device_id)
        )

    @staticmethod
    def list_devices(
        db: Session,
        page: int,
        page_size: int,
        search: str | None,
        user_id: int | None,
        is_active: bool | None,
    ) -> tuple[list[Device], int, int]:
        conditions = []

        if search:
            search_pattern = f"%{search.strip()}%"

            conditions.append(
                or_(
                    Device.name.ilike(search_pattern),
                    Device.device_identifier.ilike(
                        search_pattern
                    ),
                )
            )

        if user_id is not None:
            conditions.append(
                Device.user_id == user_id
            )

        if is_active is not None:
            conditions.append(
                Device.is_active == is_active
            )

        count_statement = select(
            func.count(Device.id)
        )

        if conditions:
            count_statement = count_statement.where(
                *conditions
            )

        total = db.scalar(count_statement) or 0

        offset = (page - 1) * page_size

        statement = (
            select(Device)
            .where(*conditions)
            .order_by(Device.id.desc())
            .offset(offset)
            .limit(page_size)
        )

        devices = list(
            db.scalars(statement).all()
        )

        total_pages = ceil(total / page_size) if total else 0

        return devices, total, total_pages

    @staticmethod
    def update(
        db: Session,
        device: Device,
        data: DeviceUpdate,
    ) -> Device:
        update_data = data.model_dump(
            exclude_unset=True
        )

        for field, value in update_data.items():
            setattr(device, field, value)

        AuditLogService.create_log(
            db=db,
            action="UPDATE",
            entity_type="DEVICE",
            entity_id=device.id,
            details={
                "updated_fields": list(update_data.keys()),
                "changes": update_data,
            },
        )

        db.commit()
        db.refresh(device)

        return device

    @staticmethod
    def update_status(
        db: Session,
        device: Device,
        is_active: bool,
    ) -> Device:
        previous_status = device.is_active

        device.is_active = is_active

        AuditLogService.create_log(
            db=db,
            action="ENABLE" if is_active else "DISABLE",
            entity_type="DEVICE",
            entity_id=device.id,
            details={
                "previous_status": previous_status,
                "new_status": is_active,
            },
        )

        db.commit()
        db.refresh(device)

        return device