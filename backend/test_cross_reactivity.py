import unittest
from unittest.mock import patch, MagicMock

import cross_reactivity as cr
import api


class TestLocalCrossReactivityRules(unittest.TestCase):

    def test_no_match_returns_empty(self):
        self.assertEqual(cr.infer_local_cross_reactive_risks(["chicken", "rice"]), [])

    def test_single_match_is_low_risk(self):
        results = cr.infer_local_cross_reactive_risks(["banana"])
        avocado = next(r for r in results if r["allergen"] == "avocado")
        self.assertEqual(avocado["risk_level"], "low")
        self.assertEqual(avocado["based_on_group"], "Latex-Fruit Syndrome")

    def test_two_matches_in_same_group_is_high_risk(self):
        results = cr.infer_local_cross_reactive_risks(["banana", "avocado"])
        kiwi = next(r for r in results if r["allergen"] == "kiwi")
        self.assertEqual(kiwi["risk_level"], "high")
        self.assertCountEqual(kiwi["matched_triggers"], ["avocado", "banana"])

    def test_uncovered_allergens(self):
        uncovered = cr.get_uncovered_allergens(["banana", "quinoa"])
        self.assertIn("quinoa", uncovered)
        self.assertNotIn("banana", uncovered)


class TestGetCrossReactiveRisks(unittest.TestCase):
    """用假 tracker 代替全局单例,避免测试写脏真实的 diet_data.json。"""

    def setUp(self):
        self.fake_tracker = MagicMock()
        self.fake_tracker.inferred_risks_cache = {}
        self.tracker_patch = patch.object(api, "tracker", self.fake_tracker)
        self.tracker_patch.start()

    def tearDown(self):
        self.tracker_patch.stop()

    def test_local_hit_does_not_call_ai(self):
        with patch.object(api, "infer_via_ai") as mock_ai:
            results, source = api.get_cross_reactive_risks(["banana", "avocado"])
            mock_ai.assert_not_called()
            self.assertEqual(source, "local_db")
            self.assertTrue(len(results) > 0)

    def test_local_miss_triggers_ai_fallback(self):
        fake_ai_result = [{
            "allergen": "durian",
            "risk_level": "low",
            "based_on_group": "Test Group",
            "matched_triggers": ["quinoa"]
        }]
        with patch.object(api, "infer_via_ai", return_value=fake_ai_result) as mock_ai:
            results, source = api.get_cross_reactive_risks(["quinoa"])
            mock_ai.assert_called_once()
            self.assertEqual(source, "ai_api")
            self.assertEqual(results[0]["allergen"], "durian")

    def test_result_is_cached_after_first_call(self):
        fake_ai_result = [{
            "allergen": "durian",
            "risk_level": "low",
            "based_on_group": "Test Group",
            "matched_triggers": ["quinoa"]
        }]
        with patch.object(api, "infer_via_ai", return_value=fake_ai_result) as mock_ai:
            api.get_cross_reactive_risks(["quinoa"])
            api.get_cross_reactive_risks(["quinoa"])
            mock_ai.assert_called_once()  # 第二次应直接命中缓存,不再重新调用 AI


class TestInferViaAI(unittest.TestCase):

    def test_malformed_json_returns_empty_list(self):
        with patch.object(api, "ai_model", MagicMock()), \
             patch.object(api, "call_gemini_json", side_effect=ValueError("bad json")):
            result = api.infer_via_ai(["quinoa"])
            self.assertEqual(result, [])

    def test_ai_model_not_configured_returns_empty_list(self):
        with patch.object(api, "ai_model", None):
            result = api.infer_via_ai(["quinoa"])
            self.assertEqual(result, [])


if __name__ == "__main__":
    unittest.main()
