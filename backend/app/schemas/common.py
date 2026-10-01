from pydantic import BaseModel, ConfigDict


class PaginationMetadata(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    page: int
    page_size: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool