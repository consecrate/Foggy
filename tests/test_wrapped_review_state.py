from __future__ import annotations

import unittest

from wrapped_review_state import WrappedReviewState


class WrappedReviewStateTests(unittest.TestCase):
    def test_upcoming_reward_key_starts_with_first_reward(self) -> None:
        state = WrappedReviewState(reward_goal=10)

        self.assertEqual(state.upcoming_reward_key, 1)
        for card_id in range(1, 6):
            state.state_for_question(card_id)

        self.assertEqual(state.upcoming_reward_key, 1)

    def test_explicit_undo_rewinds_progress(self) -> None:
        state = WrappedReviewState(reward_goal=10)

        state.state_for_question(101)
        state.state_for_question(102)
        state.state_for_question(103)

        state.undo()
        self.assertEqual(state.state_for_question(102), (2, False, 0))

    def test_branch_after_undo_trims_future_history(self) -> None:
        state = WrappedReviewState(reward_goal=10)

        state.state_for_question(101)
        state.state_for_question(102)
        state.state_for_question(103)

        state.undo()
        self.assertEqual(state.state_for_question(102), (2, False, 0))
        self.assertEqual(state.state_for_question(104), (3, False, 0))
        self.assertEqual(state.question_history, [101, 102, 104])

    def test_explicit_undo_rewinds_without_double_counting(self) -> None:
        state = WrappedReviewState(reward_goal=10)

        state.state_for_question(101)
        state.state_for_question(102)
        state.state_for_question(103)

        state.undo()
        self.assertEqual(state.current_state(), (2, False, 0))
        self.assertEqual(state.state_for_question(102), (2, False, 0))
        self.assertEqual(state.state_for_question(104), (3, False, 0))
        self.assertEqual(state.question_history, [101, 102, 104])

    def test_continue_cycle_floors_rewind_at_zero(self) -> None:
        state = WrappedReviewState(reward_goal=10)

        for card_id in range(1, 11):
            progress, show_reward, reward_key = state.state_for_question(card_id)

        self.assertEqual((progress, show_reward, reward_key), (10, True, 1))

        state.continue_cycle()
        state.undo()
        self.assertEqual(state.current_state(), (0, False, 1))
        self.assertEqual(state.state_for_question(9), (0, False, 1))
        self.assertEqual(state.state_for_question(11), (0, False, 1))
        self.assertEqual(state.state_for_question(12), (1, False, 1))

    def test_revisiting_goal_card_keeps_same_reward(self) -> None:
        state = WrappedReviewState(reward_goal=10)

        for card_id in range(1, 11):
            progress, show_reward, reward_key = state.state_for_question(card_id)

        self.assertEqual((progress, show_reward, reward_key), (10, True, 1))
        state.undo()
        self.assertEqual(state.state_for_question(9), (9, False, 1))
        self.assertEqual(state.state_for_question(10), (10, True, 1))

        state.continue_cycle()
        for card_id in range(11, 21):
            progress, show_reward, reward_key = state.state_for_question(card_id)

        self.assertEqual((progress, show_reward, reward_key), (10, True, 2))

    def test_upcoming_reward_key_stays_on_current_reward_until_continue(self) -> None:
        state = WrappedReviewState(reward_goal=10)

        for card_id in range(1, 11):
            state.state_for_question(card_id)

        self.assertEqual(state.upcoming_reward_key, 1)
        state.undo()
        state.state_for_question(9)
        self.assertEqual(state.upcoming_reward_key, 1)

        state.continue_cycle()
        self.assertEqual(state.upcoming_reward_key, 2)


if __name__ == "__main__":
    unittest.main()
