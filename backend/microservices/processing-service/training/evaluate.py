from sklearn.metrics import classification_report, confusion_matrix

def evaluate(model, X_test, y_test, label_encoder):
    preds = model.predict(X_test)

    # Convert classes to strings to avoid the "len()" error with numeric labels
    target_names = [str(c) for c in label_encoder.classes_]

    print("\n📊 Classification Report")
    print(
        classification_report(
            y_test,
            preds,
            target_names=target_names
        )
    )

    print("🧮 Confusion Matrix")
    print(confusion_matrix(y_test, preds))