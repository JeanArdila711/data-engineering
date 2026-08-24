from pipeline.entailment import compute_error_rate, sampling_rate_for, select_sample


def test_select_sample_is_deterministic():
    ids = list(range(100))
    assert select_sample(ids) == select_sample(ids)


def test_select_sample_respects_rate():
    ids = list(range(100))
    assert len(select_sample(ids, rate=0.10)) == 10


def test_select_sample_respects_minimum_even_with_few_items():
    ids = list(range(3))
    assert len(select_sample(ids, rate=0.10, minimum=5)) == len(ids)  # no puede exceder el total


def test_select_sample_enforces_minimum_when_available():
    ids = list(range(20))
    assert len(select_sample(ids, rate=0.10, minimum=5)) == 5


def test_compute_error_rate():
    assert compute_error_rate([True, True, False, True]) == 0.25


def test_compute_error_rate_of_empty_is_zero():
    assert compute_error_rate([]) == 0.0


def test_sampling_rate_escalates_above_threshold():
    assert sampling_rate_for(recent_error_rate=0.06, threshold=0.05) == 1.0


def test_sampling_rate_stays_low_below_threshold():
    assert sampling_rate_for(recent_error_rate=0.02, threshold=0.05) == 0.10
