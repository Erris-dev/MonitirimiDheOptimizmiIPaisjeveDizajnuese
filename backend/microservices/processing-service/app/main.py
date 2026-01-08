from app.kafka.consumer import KafkaConsumerClient
from app.utils.logger import get_logger

# Initialize service logger
logger = get_logger("processing_service.main")

def main():
    """
    Entrypoint for the Processing Service.
    Starts Kafka consumer to listen to user metric events,
    performs ML predictions, and publishes results with recommendations.
    """
    logger.info("🚀 Starting Processing Service...")

    try:
        # Initialize Kafka consumer
        consumer = KafkaConsumerClient()
        logger.info("Kafka consumer initialized and subscribing to topics.")

        # Start consuming messages (infinite loop)
        consumer.start()

    except KeyboardInterrupt:
        logger.warning("Processing service interrupted by user.")

    except Exception as e:
        logger.exception(f"Fatal error in main: {e}")

    finally:
        logger.info("Processing Service stopped.")


if __name__ == "__main__":
    main()
