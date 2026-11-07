from datetime import datetime, timezone
import json
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

def utcnow():
    return datetime.now(timezone.utc)

class Locket(Base):
    __tablename__ = "lockets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    caption: Mapped[str] = mapped_column(String(255), default="")
    visibility: Mapped[str] = mapped_column(String(20), default="friends", index=True)  # friends, public, private
    reactions_json: Mapped[str] = mapped_column(Text, default="{}")  # {"❤️": [1, 2], "🔥": [3]}
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    owner = relationship("User", back_populates="lockets")

    @property
    def reactions(self) -> dict[str, list[int]]:
        try:
            return json.loads(self.reactions_json or "{}")
        except Exception:
            return {}

    @reactions.setter
    def reactions(self, value: dict[str, list[int]]):
        self.reactions_json = json.dumps(value or {})
