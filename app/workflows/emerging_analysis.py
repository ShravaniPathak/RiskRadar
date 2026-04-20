import uuid
from app.utils.load_model import get_enriched_data
from app.utils.analysis import emerging_with_growth

import logging

my_logger = logging.getLogger("my_app_logger")
my_logger.setLevel(logging.INFO)


def er_analysis(ticker: str, year1: int, year2: int):
    job_id = str(uuid.uuid4())
    my_logger.info(f"Analysis begun for ticker {ticker}")

    final_output = emerging_with_growth(ticker, year1, year2)

    return final_output
