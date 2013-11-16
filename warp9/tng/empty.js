expose(empty);

function empty() {
    throw new root.tng.reactive.EmptyError();
}