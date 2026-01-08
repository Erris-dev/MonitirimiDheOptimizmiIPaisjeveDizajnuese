import json
import logging
from confluent_kafka import Consumer
from app.config.settings import settings
from app.kafka.producer import send_message
from app.ml.predictor import predict_all
from app.ml.schemas import UserMetrics

logger = logging.getLogger("processing.kafka.consumer")
logging.basicConfig(level=logging.INFO)


class KafkaConsumerClient:
    def __init__(self):
        self.consumer = Consumer({
            "bootstrap.servers": settings.KAFKA_BOOTSTRAP_SERVERS,
            "group.id": settings.KAFKA_GROUP_ID,
            "auto.offset.reset": settings.KAFKA_AUTO_OFFSET_RESET,
            "enable.auto.commit": settings.KAFKA_ENABLE_AUTO_COMMIT,
        })

    def start(self):
        logger.info("Starting Kafka consumer...")
        self.consumer.subscribe([settings.KAFKA_INPUT_TOPIC])

        try:
            while True:
                msg = self.consumer.poll(timeout=1.0)

                if msg is None:
                    continue

                if msg.error():
                    logger.error(f"Kafka error: {msg.error()}")
                    continue

                self._handle_message(msg)

        except KeyboardInterrupt:
            logger.warning("Consumer interrupted by user")
        finally:
            self.consumer.close()
            logger.info("Kafka consumer closed")

    def _handle_message(self, msg):
        try:
            payload = json.loads(msg.value().decode("utf-8"))
            logger.info(f"Received event: {payload}")

            # Validate and parse incoming event
            event = UserMetrics(**payload)

            # Run ML inference for all models
            predictions = predict_all(event)

            # Publish result
            send_message(settings.KAFKA_OUTPUT_TOPIC, predictions)

            # Commit manually if auto-commit is disabled
            if not settings.KAFKA_ENABLE_AUTO_COMMIT:
                self.consumer.commit(msg)

            logger.info(f"Message processed successfully: {predictions}")

        except Exception as e:
            logger.error(f"Failed to process message: {e}", exc_info=True)
