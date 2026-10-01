from math import ceil

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.services.audit_log_service import AuditLogService


class UserService:
    @staticmethod
    def create(
        db: Session,
        data: UserCreate,
    ) -> User:
        normalized_email = str(data.email).strip().lower()

        existing_user = db.scalar(
            select(User).where(
                func.lower(User.email) == normalized_email,
            )
        )

        if existing_user is not None:
            raise ValueError(
                "A user with this email already exists."
            )

        user = User(
            name=data.name,
            email=normalized_email,
            is_active=True,
        )

        db.add(user)

        try:
            db.flush()

            AuditLogService.create_log(
                db=db,
                action="CREATE",
                entity_type="USER",
                entity_id=user.id,
                details={
                    "name": user.name,
                    "email": user.email,
                    "is_active": user.is_active,
                },
            )

            db.commit()

        except IntegrityError:
            db.rollback()
            raise ValueError(
                "A user with this email already exists."
            )

        db.refresh(user)

        return user

    @staticmethod
    def get_by_id(
        db: Session,
        user_id: int,
    ) -> User | None:
        return db.scalar(
            select(User).where(User.id == user_id)
        )

    @staticmethod
    def list_users(
        db: Session,
        page: int,
        page_size: int,
        search: str | None,
        is_active: bool | None,
    ) -> tuple[list[User], int, int]:
        conditions = []

        if search:
            search_pattern = f"%{search.strip()}%"

            conditions.append(
                or_(
                    User.name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                )
            )

        if is_active is not None:
            conditions.append(
                User.is_active == is_active
            )

        count_statement = select(
            func.count(User.id)
        )

        if conditions:
            count_statement = count_statement.where(
                *conditions
            )

        total = db.scalar(count_statement) or 0

        offset = (page - 1) * page_size

        statement = (
            select(User)
            .where(*conditions)
            .order_by(User.id.desc())
            .offset(offset)
            .limit(page_size)
        )

        users = list(
            db.scalars(statement).all()
        )

        total_pages = ceil(total / page_size) if total else 0

        return users, total, total_pages

    @staticmethod
    def update(
        db: Session,
        user: User,
        data: UserUpdate,
    ) -> User:
        update_data = data.model_dump(
            exclude_unset=True
        )

        if "email" in update_data:
            normalized_email = (
                str(update_data["email"])
                .strip()
                .lower()
            )

            existing_user = db.scalar(
                select(User).where(
                    func.lower(User.email) == normalized_email,
                    User.id != user.id,
                )
            )

            if existing_user is not None:
                raise ValueError(
                    "A user with this email already exists."
                )

            update_data["email"] = normalized_email

        for field, value in update_data.items():
            setattr(user, field, value)

        try:
            AuditLogService.create_log(
                db=db,
                action="UPDATE",
                entity_type="USER",
                entity_id=user.id,
                details={
                    "updated_fields": list(update_data.keys()),
                    "changes": update_data,
                },
            )

            db.commit()

        except IntegrityError:
            db.rollback()
            raise ValueError(
                "Unable to update user because the email already exists."
            )

        db.refresh(user)

        return user

    @staticmethod
    def update_status(
        db: Session,
        user: User,
        is_active: bool,
    ) -> User:
        previous_status = user.is_active

        user.is_active = is_active

        AuditLogService.create_log(
            db=db,
            action="ENABLE" if is_active else "DISABLE",
            entity_type="USER",
            entity_id=user.id,
            details={
                "previous_status": previous_status,
                "new_status": is_active,
            },
        )

        db.commit()
        db.refresh(user)

        return user