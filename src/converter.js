
function toGraphLib(graph) {
    function setNodeLabel(node) {
        return {
            width: node.getGeometry().width,
            height: node.getGeometry().height,
            rank: node.getAttribute('rank')
        };
    }

    function setEdgeLabel(edge) {
        return {
            minLen: edge.getAttribute('minLen') || 1
        };
    }

    function setEdgeName(edge) {
        return edge.getId();
    }

    var graphModel = graph.getModel();
    var glGraph = new graphlib.Graph({
        directed: true,
        compound: true,
        multigraph: true
    });

    glGraph.setGraph({});
    for (var id in graphModel.cells) {
        var cell = graphModel.cells[id];
        if (cell.isEdge() && (cell.target.children == null)) { //dagre can't handle edges on compound nodes   https://github.com/cytoscape/cytoscape.js-dagre/blob/master/cytoscape-dagre.js:126
            var source = cell.source;
            var target = cell.target;
            if (!source.id || !target.id) return;
            glGraph.setEdge(source.id, target.id, setEdgeLabel(cell), setEdgeName(cell));
        } else if (cell.isVertex()) {
            glGraph.setNode(cell.getId(), setNodeLabel(cell));
            if (glGraph.isCompound() && (cell.getParent() != null)) {
                console.log("set parent for " + cell.id + " parent is " + cell.getParent().value);
                glGraph.setParent(cell.id, cell.getParent().id);
            }
        }
    }
    return glGraph;
}

function updateInputGraph(graph, glGraph, opt) {

    function importNode(nodeId, glGraph) {
        var cell = this.getModel().getCell(nodeId);
        if (cell && cell.isVertex()) {
            var glNode = glGraph.node(nodeId);
            var geometry = cell.getGeometry();
            geometry.x = glNode.x - glNode.width / 2;
            geometry.y = glNode.y - glNode.height / 2;
        }
    }

    function importEdge(edgeObj, gl) {
        var cell = this.getModel().getCell(edgeObj.name);
        var glEdge = gl.edge(edgeObj);
        var points = glEdge.points || [];
        var geometry = cell.getGeometry();
        //                geometry.points = points.slice(1, points.length - 1);
        //                geometry.points = points;
    }

    glGraph.nodes().forEach(function(nodeId) {
        importNode.call(graph, nodeId, glGraph);
    });

    glGraph.edges().forEach(function(edge) {
        importEdge.call(graph, edge, glGraph);
    });

    _.chain(g.nodes())
        .filter(function(v) {
            return g.children(v).length > 0;
        })
        .map(graph.getModel().getCell, graph.getModel())
        .filter(function(cell) {
            return cell.isVertex();
        })
        // .forEach(function(x){console.log("****fdsf*****");console.log(x); console.log(x.isVertex())})
        .sortBy(function(cluster) {
            return -cluster.getAncestors().length;
        })
        .invoke('fitEmbeds', graph, {
            padding: 10
        })
        .value();
}
