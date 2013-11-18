expose(empty);

function empty() {
    throw new root.core.cells.EmptyError();
}