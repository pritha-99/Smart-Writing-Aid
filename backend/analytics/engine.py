from __future__ import annotations


class AnalyticsEngine:
    @staticmethod
    def focus_score(writing_time: float, total_session_time: float) -> float:
        if total_session_time <= 0:
            return 0.0
        return round((writing_time / total_session_time) * 100, 2)
