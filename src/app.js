mxCell.prototype.getAncestors = function() {
    var result = [];
    var vertex = this;
    while (vertex.parent != null) {
        result.push(vertex.parent);
        vertex = vertex.parent;
    }
    return result;
};

mxCell.prototype.fitEmbeds = function(graph, opt) {
    opt = opt || {};
    var embeddedCells = _.filter(this.children, function(cell) {
        return cell.isVertex();
    });
    if (embeddedCells.length > 0) {
        if (opt.deep) {
            _.invoke(embeddedCells, 'fitEmbeds', graph, opt);
        }
        var bounds = graph.getBoundingBoxFromGeometry(embeddedCells);
        this.geometry.x = bounds.x - opt.padding;
        this.geometry.y = bounds.y - opt.padding;
        this.geometry.width = bounds.width + 2 * opt.padding;
        this.geometry.height = bounds.height + 2 * opt.padding;
        var that = this;
        embeddedCells.forEach(function(cell) {
            cell.geometry.x -= that.geometry.x
            cell.geometry.y -= that.geometry.y
        });
        return this;
    }
};

var vertexConfig = {
    "HW::HiCloud::AvailableZone": {
        shape: mxConstants.SHAPE_RECTANGLE,
        opacity: 30,
        fontColor: '#ADADAD',
        strokeColor: '#ADADAD',
        fillColor: '#FCA62A'
    },
    "HW::HiCloud::VPC": {
        shape: mxConstants.SHAPE_CLOUD,
        opacity: 30,
        strokeColor: '#ADADAD',
        fillColor: '#0E88EB'
    },
    "HW::HiCloud::Subnet": {
        
    },
    "HW::HiCloud::Instance": {
        
    },
    "HW::HiCloud::EIP": {
        
    }
};

function initStyleMap(graph) {
    _.each(vertexConfig, function(v, k) {
        graph.getStylesheet().putCellStyle(styleNameByType(k), v);
    });
}

function styleNameByType(fullName) {
    return fullName.split("::")[2] || "ROUNDED";
}

function main(container, data) {
    if (!mxClient.isBrowserSupported()) {
        mxUtils.error('Browser is not supported!', 200, false);
    } else {
        mxEvent.disableContextMenu(container);
        var graph = new mxGraph(container);
        var parent = graph.getDefaultParent();
        graph.getStylesheet().getDefaultEdgeStyle()[mxConstants.STYLE_EDGE] = mxConstants.EDGESTYLE_ORTHOGONAL;
        initStyleMap(graph);

        graph.getModel().beginUpdate();
        try {
            var obj = {};
            var nodes = _.each(data.resources, function(v, k) {
                obj[k] = graph.insertVertex(parent, null, k, 0, 0, 100, 100, styleNameByType(v.type));
            });

            var containers = _.filter(data.metadata, function(item) {
                return item.parent !== undefined;
            });

            _.each(containers, function(container) {
                var child = obj[container.id];
                var parent = obj[container.parent];

                child.removeFromParent();
                parent.insert(child);
            });

            _.each(data.relations, function(item) {
                var from  = obj[item.from];
                var to = obj[item.to];
                graph.insertEdge(parent, null, item.type, from, to);
            });
            
            g = toGraphLib(graph);
            dagre.layout(g);
            
            updateInputGraph(graph, g);
        } finally {
            graph.getModel().endUpdate();
        }
    }
}

window.onload = function() {
    var container = document.getElementById('graphContainer');
    $.get('/data/4.json').done(function(data) {
        main(container, data);
    });
}