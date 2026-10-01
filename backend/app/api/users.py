from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import (
    UserCreate,
    UserListResponse,
    UserResponse,
    UserStatusUpdate,
    UserUpdate,
)
from app.schemas.common import PaginationMetadata
from app.services.user_service import UserService


router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


DbSession = Annotated[Session, Depends(get_db)]


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a user",
    description="Create a new active user.",
)
def create_user(
    payload: UserCreate,
    db: DbSession,
) -> UserResponse:
    try:
        user = UserService.create(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    return user


@router.get(
    "",
    response_model=UserListResponse,
    status_code=status.HTTP_200_OK,
    summary="List users",
)
def list_users(
    db: DbSession,
    page: int = Query(
        default=1,
        ge=1,
        description="Page number.",
    ),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Number of records per page.",
    ),
    search: str | None = Query(
        default=None,
        min_length=1,
        max_length=100,
        description="Search by name or email.",
    ),
    is_active: bool | None = Query(
        default=None,
        description="Filter by active status.",
    ),
) -> UserListResponse:
    users, total, total_pages = UserService.list_users(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        is_active=is_active,
    )

    return UserListResponse(
        items=users,
        pagination=PaginationMetadata(
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1 and total_pages > 0,
        ),
    )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a user",
)
def get_user(
    user_id: int,
    db: DbSession,
) -> UserResponse:
    user = UserService.get_by_id(
        db,
        user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return user


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a user",
)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: DbSession,
) -> UserResponse:
    user = UserService.get_by_id(
        db,
        user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if not payload.model_dump(exclude_unset=True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided.",
        )

    try:
        return UserService.update(
            db,
            user,
            payload,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.patch(
    "/{user_id}/status",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Enable or disable a user",
)
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: DbSession,
) -> UserResponse:
    user = UserService.get_by_id(
        db,
        user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return UserService.update_status(
        db,
        user,
        payload.is_active,
    )