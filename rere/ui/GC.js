expose({
    trackCellsBlock: trackCellsBlock,
    forgetCellsBlock: forgetCellsBlock,
    info: info,
    collect: collect,
    count: count
});

var blocks = {}

function collect() {
    root.reactive.GC.collect.apply(root.reactive.GC, cellRoots());
}

function count() {
    return root.reactive.GC.count.apply(root.reactive.GC, cellRoots());
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

function cellRoots() {
    var era = new Object();

    var roots = {};
    for (var i in blocks) {
        if (!blocks.hasOwnProperty(i)) continue;
        for (var j in blocks[i]) {
            if (!blocks[i].hasOwnProperty(j)) continue;
            findRoot(blocks[i][j], roots);
        }
    }

    return root.utils.hashValues(roots);

    function findRoot(cell, roots) {
        if (cell.era===era) return;
        cell.era = era;
        if (cell.dependanties.length==0) {
            roots[cell.id] = cell;
        } else {
            cell.dependanties.forEach(function(item){ findRoot(item, roots); });
        }
    }
}