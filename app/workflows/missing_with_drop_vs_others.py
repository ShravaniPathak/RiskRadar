from app.utils.analysis import missing_with_drop_vs_others

import logging

my_logger = logging.getLogger("my_app_logger")
my_logger.setLevel(logging.INFO)


def missing_with_drop_vs_others_anlaysis(ticker: str, year: int):
    my_logger.info(f"Analysis begun for ticker {ticker}")

    final_output = missing_with_drop_vs_others(ticker, year)

    return final_output
