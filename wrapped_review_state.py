from __future__ import annotations

from dataclasses import dataclass, field
import sys


_DATACLASS_KWARGS = {"slots": True} if sys.version_info >= (3, 10) else {}


@dataclass(**_DATACLASS_KWARGS)
class WrappedReviewState:
    reward_goal: int
    question_history: list[int] = field(default_factory=list)
    current_index: int | None = None
    cycle_start_index: int = 0
    reward_sequence: int = 0
    reward_key: int = 0

    @property
    def progress(self) -> int:
        if self.current_index is None:
            return 0

        progress = self.current_index - self.cycle_start_index + 1
        return max(0, min(self.reward_goal, progress))

    def reset(self) -> None:
        self.question_history.clear()
        self.current_index = None
        self.cycle_start_index = 0
        self.reward_sequence = 0
        self.reward_key = 0

    def continue_cycle(self) -> None:
        if self.current_index is None:
            self.cycle_start_index = len(self.question_history)
            return

        self.cycle_start_index = self.current_index + 1

    def undo(self) -> None:
        if self.current_index is None:
            return

        if self.current_index > 0:
            self.current_index -= 1

    def current_state(self) -> tuple[int, bool, int]:
        progress = self.progress
        return (progress, progress == self.reward_goal, self.reward_key)

    @property
    def upcoming_reward_key(self) -> int:
        if self._cycle_reward_already_assigned():
            return self.reward_key

        return self.reward_sequence + 1

    def state_for_question(self, card_id: int) -> tuple[int, bool, int]:
        reached_new_card = self._move_to_question(card_id)
        progress = self.progress

        if reached_new_card and progress == self.reward_goal:
            self.reward_sequence += 1
            self.reward_key = self.reward_sequence

        return (progress, progress == self.reward_goal, self.reward_key)

    def _move_to_question(self, card_id: int) -> bool:
        if self.current_index is not None:
            current_card_id = self.question_history[self.current_index]
            if current_card_id == card_id:
                return False

            next_index = self.current_index + 1
            if next_index < len(self.question_history) and self.question_history[next_index] == card_id:
                self.current_index = next_index
                return False

            del self.question_history[next_index:]

        self.question_history.append(card_id)
        self.current_index = len(self.question_history) - 1
        return True

    def _cycle_reward_already_assigned(self) -> bool:
        return self.reward_key > 0 and len(self.question_history) - self.cycle_start_index >= self.reward_goal
