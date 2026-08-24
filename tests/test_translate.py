from pipeline.translate import translate_summary


class _FakeTranslator:
    def translate(self, text: str) -> str:
        return f"[ES] {text}"


def test_translate_summary_delegates_to_client():
    assert translate_summary("DuckDB broke the extension API.", _FakeTranslator()) == "[ES] DuckDB broke the extension API."
