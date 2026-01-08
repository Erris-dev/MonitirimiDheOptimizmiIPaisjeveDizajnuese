import json
from confluent_kafka import Producer
from app.config.settings import settings
import logging

logger = logging.getLogger("processing.kafka.producer")
logging.basicConfig(level=logging.INFO)

# Create a singleton producer instance
_producer = Producer({"bootstrap.servers": settings.KAFKA_BOOTSTRAP_SERVERS, "linger.ms": 5})


def send_message(topic: str, value: dict, key: str | None = None):
    """
    Publish a message to Kafka.
    """
    try:
        _producer.produce(
            topic=topic,
            key=key,
            value=json.dumps(value).encode("utf-8"),
            on_delivery=_delivery_report,
        )
        _producer.poll(0)

    except Exception as e:
        logger.error(f"Failed to produce message: {e}", exc_info=True)


def _delivery_report(err, msg):
    """
    Delivery report callback called once message is delivered (or failed).
    """
    if err is not None:
        logger.error(f"Delivery failed: {err}")
    else:
        logger.info(f"Message delivered to {msg.topic()} [{msg.partition()}]")
