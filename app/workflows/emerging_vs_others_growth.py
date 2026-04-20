from app.utils.analysis import emerging_vs_others_growth

import logging

my_logger = logging.getLogger("my_app_logger")
my_logger.setLevel(logging.INFO)


def emerging_vs_others_growth_analysis(ticker: str, year: int):
    my_logger.info(f"Analysis begun for ticker {ticker}")

    final_output = emerging_vs_others_growth(ticker, year)

    return final_output
