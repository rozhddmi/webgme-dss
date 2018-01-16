//TODO: Consider using https://github.com/alexcurtis/react-treebeard for tree view.
import React from 'react';
import PropTypes from 'prop-types';

import ExpansionPanel, {
    ExpansionPanelDetails,
    ExpansionPanelSummary
} from 'material-ui/ExpansionPanel';
import ExpandMoreIcon from 'material-ui-icons/ExpandMore';

import SingleConnectedNode from './gme/BaseComponents/SingleConnectedNode';
import getObjectSorter from './gme/utils/getObjectSorter';

import PartBrowserItem from './PartBrowserItem';

const TREE_PATH_SEP = '$';
const nameSort = getObjectSorter('name', true);


export default class PartBrowser extends SingleConnectedNode {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            validChildren: []
        };
    }

    onNodeLoad(nodeObj) {
        const client = this.props.gmeClient,
            childrenDesc = nodeObj.getValidChildrenTypesDetailed();

        // All children are meta-nodes -> thus available right away
        let validChildren = Object.keys(childrenDesc).map((id) => {
            let metaNode = client.getNode(id);
            return {
                id: metaNode.getId(),
                name: metaNode.getAttribute('name'),
                treePath: typeof this.props.treePathGetter === 'function' ? this.props.treePathGetter(metaNode) : null,
                active: childrenDesc[id]
            };
        });

        // TODO: This is probably not the most efficient way of updating the state.
        this.setState({
            loaded: true,
            validChildren: validChildren
        });
    }

    onNodeUpdate(nodeObj) {

    }

    onNodeUnload(nodeId) {

    }

    render() {
        let tree = {children: [], folders: {}, path: 'ROOT'};

        if (!this.state.loaded) {
            return (<div>Loading node in Part Browser ...</div>);
        }

        this.state.validChildren
            .forEach(function (childDesc) {
                let treeNode = tree;

                if (typeof childDesc.treePath === 'string') {
                    childDesc.treePath.split(TREE_PATH_SEP)
                        .forEach(function (path, i, arr) {
                            if (i === arr.length - 1) {
                                treeNode.children.push(childDesc);
                            } else {
                                if (!treeNode.folders[path]) {
                                    treeNode.folders[path] = {
                                        isFolder: true,
                                        isRoot: i === 0,
                                        name: path,
                                        path: treeNode.path + '$' + path,
                                        description: 'This library is bla, bla, bla..',
                                        folders: {},
                                        children: []
                                    };

                                    treeNode.children.push(treeNode.folders[path]);
                                }

                                treeNode = treeNode.folders[path];
                            }
                        });
                } else {
                    treeNode.children.push(childDesc);
                }
            });

        function buildTreeStructure(treeNode) {
            if (treeNode.isFolder) {
                if (treeNode.isRoot) {
                    return (
                        <ExpansionPanel key={treeNode.path} defaultExpanded>
                            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                                {treeNode.name}
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                {treeNode.children.sort(nameSort).map(buildTreeStructure)}
                            </ExpansionPanelDetails>
                        </ExpansionPanel>);
                } else {
                    return (
                        <div key={treeNode.path} style={{marginLeft: 30}}>
                            <h6>{treeNode.name}</h6>
                            {treeNode.children.sort(nameSort).map(buildTreeStructure)}
                        </div>
                    )
                }
            } else {
                // TODO: This should be a draggable item
                return (
                    <PartBrowserItem key={treeNode.id} treeNode={treeNode}/>
                )
            }
        }

        return (
            <div style={{width: '100%'}}>
                {tree.children.map(buildTreeStructure)}
            </div>
        );
    }
}

PartBrowser.propTypes = {
    gmeClient: PropTypes.object.isRequired,
    activeNode: PropTypes.string.isRequired,
    treePathGetter: PropTypes.func
};