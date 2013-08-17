expose({
    trackCellsBlock: trackCellsBlock,
    forgetCellsBlock: forgetCellsBlock,
    info: info,
    collect: collect
});

var blocks = {}

function collect() {

}

function trackCellsBlock(block) {
    blocks[block.id] = block.cells;
}

function forgetCellsBlock(block) {
    delete blocks[block.id];
}

function info() {
    return {blocks: len(blocks) };
    function len(hash) {
        var count = 0;
        for (var i in hash) {
            if (!hash.hasOwnProperty(i)) continue;
            count++;
        }
        return count;
    }
}