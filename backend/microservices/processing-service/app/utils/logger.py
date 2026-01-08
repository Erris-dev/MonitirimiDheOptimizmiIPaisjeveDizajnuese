import logging
import sys
from typing import Optional


def get_logger(
    name: str,
    level: Optional[str] = None
) -> logging.Logger:
    """
    Centralized structured logger factory.
    """

    log_level = level or "INFO"
    log_level = log_level.upper()

    logger = logging.getLogger(name)

    # Prevent duplicate handlers (important for Kafka consumers)
    if logger.handlers:
        return logger

    logger.setLevel(log_level)

    handler = logging.StreamHandler(sys.stdout)

    formatter = logging.Formatter(
        fmt=(
            "%(asctime)s | "
            "%(levelname)s | "
            "%(name)s | "
            "%(message)s"
        ),
        datefmt="%Y-%m-%dT%H:%M:%S"
    )

    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

    return logger
