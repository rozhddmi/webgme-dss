import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Q from 'q';

import Dialog, {
    DialogActions,
    DialogContent,
    DialogTitle,
} from 'material-ui/Dialog';
import moment from 'moment';
import Button from 'material-ui/Button';
import Badge from 'material-ui/Badge';
import {connect} from 'react-redux';
import IconButton from 'material-ui/IconButton';
import Visibility from 'material-ui-icons/Visibility';
import PlayArrow from 'material-ui-icons/PlayArrow';
import Grid from 'material-ui/Grid';
import Tooltip from 'material-ui/Tooltip';
import DiffViewer from './DiffViewer';

const mapStateToProps = (/* state */) => ({});

const mapDispatchToProps = (/* dispatch */) => ({});

class ProjectHistory extends Component {
    static propTypes = {
        gmeClient: PropTypes.object.isRequired,
        onOK: PropTypes.func.isRequired,
        batchSize: PropTypes.number,
    };

    static defaultProps = {
        batchSize: 200,
    };

    state = {
        commits: [],
        activeCommit: this.props.gmeClient.getActiveCommitHash(),
        showDiff: false,
        diffWithRoot: null,
        detailed: false,
        noMore: false,
    };

    componentDidMount() {
        const {gmeClient, batchSize} = this.props;
        const {activeCommit} = this.state;

        gmeClient.getHistory(gmeClient.getProjectObject().projectId, activeCommit, batchSize, this.newHistoryItems);
    }

    showDiff = (oldRootHash) => {
        this.setState({
            showDiff: true,
            diffWithRoot: oldRootHash,
        });
    };

    closeDiff = () => {
        this.setState({
            showDiff: false,
            diffWithRoot: null,
        });
    };

    newHistoryItems = (err, items) => {
        // console.log(JSON.stringify(items, null, 2));
        if (!err) {
            this.setState({
                commits: this.state.commits.concat(items),
                noMore: items.length < this.props.batchSize,
            });
        }
    };

    revertToCommit = (revertCommit) => {
        const {gmeClient} = this.props;

        if (this.reverting) {
            return;
        }

        this.reverting = true;
        const project = gmeClient.getProjectObject();
        const {activeCommit} = this.state;

        let tags;

        // FIXME: This idea with tagging domains might not that good of an idea after all..
        project.setBranchHash('master', revertCommit._id, activeCommit)
            .then((result) => {
                if (result.status !== gmeClient.CONSTANTS.STORAGE.SYNCED) {
                    throw new Error('Could not synchronize reverting of commit');
                }

                // The branch moved backwards - now make sure we clean up all obsolete domain tags
                return project.getTags();
            })
            .then((tags_) => {
                tags = tags_;

                const tagHashes = Object.keys(tags)
                    .filter(tagName => tagName.startsWith('Domain_'))
                    .map(tagName => tags[tagName]);

                return Q.all(tagHashes.map(tagHash => project.getHistory(tagHash, 1)
                    .then(commits => commits[0])));
            })
            .then((tagCommits) => {
                const tagsToRemove = tagCommits
                    .filter(tagCommit => tagCommit.time > revertCommit.time)
                    .map((tagCommit) => {
                        const tagNames = Object.keys(tags);
                        let i;

                        for (i = 0; i < tagNames.length; i += 1) {
                            if (tags[tagNames[i]] === tagCommit._id) {
                                return tagNames[i];
                            }
                        }

                        return null;
                    });

                function removeTagsThrottle() {
                    const tagName = tagsToRemove.pop();
                    if (tagName) {
                        return project.deleteTag(tagName)
                            .then(removeTagsThrottle);
                    }

                    return null;
                }

                return removeTagsThrottle();
            })
            .then(() => {
                this.props.onOK();
            })
            .catch((/* err */) => {
                // console.error(err);
            });
    };

    render() {
        const {gmeClient, batchSize} = this.props;
        const {
            commits,
            showDiff,
            diffWithRoot,
            activeCommit,
            detailed,
            noMore,
        } = this.state;
        const items = [];
        commits.forEach((commit) => {
            const when = new Date(parseInt(commit.time, 10));
            const current = commit._id === activeCommit;
            const saveMsg = commit.message.indexOf('save:') === 0;
            let color = 'lightblue';
            if (current) {
                color = 'red';
            }
            if (saveMsg) {
                color = 'blue';
            }

            if (detailed || current || saveMsg) {
                items.push((
                    <Grid
                        key={commit._id}
                        container
                        wrap="wrap"
                        style={{
                            border: '2px solid #000000',
                            color,
                            margin: '2px',
                            marginLeft: '-6px',
                            minWidth: '400px',
                        }}
                        alignItems="center"
                        color={current ? 'primary' : 'secondary'}
                    >
                        <Grid item xs={4} sm={2} style={{cursor: 'help'}}>
                            <Tooltip
                                id="time-tooltip"
                                title={moment(when)
                                    .local()
                                    .format('dddd, MMMM Do YYYY, h:mm:ss a')}
                            >
                                <Grid item>
                                    <Badge
                                        content={moment(when)
                                            .fromNow()}
                                    >{commit.updater[0]}
                                    </Badge>
                                </Grid>
                            </Tooltip>
                        </Grid>
                        <Grid item xs={12} sm={6}>{saveMsg ? commit.message.substr(6) : commit.message}</Grid>
                        <Grid item xs={5} sm={3} zeroMinWidth>
                            <Tooltip id="read-only-view-tooltip" title="Check what is different in this version">
                                <IconButton onClick={() => {
                                    this.showDiff(commit.root);
                                }}
                                >
                                    <Visibility/>
                                </IconButton>
                            </Tooltip>
                            <Tooltip id="revert-tooltip" title="Revert back to this">
                                <IconButton onClick={() => {
                                    this.revertToCommit(commit);
                                }}
                                >
                                    <PlayArrow/>
                                </IconButton>
                            </Tooltip>
                        </Grid>
                    </Grid>));
            }
        });

        return (
            <Dialog open>
                <DialogTitle>Project History</DialogTitle>
                <DialogContent>
                    <Grid container style={{paddingTop: '24px'}} spacing={16}>
                        {items}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            this.setState({detailed: !detailed});
                        }}
                    >{detailed ? 'Hide details' : 'Show details'}
                    </Button>
                    <Button
                        disabled={noMore}
                        onClick={() => {
                            const lastCommit = commits.length === 0 ? gmeClient.getActiveCommitHash() :
                                commits[commits.length - 1].parents[0];

                            gmeClient.getHistory(
                                gmeClient.getProjectObject().projectId,
                                lastCommit,
                                batchSize,
                                this.newHistoryItems,
                            );
                        }}
                        color="secondary"
                    >getMore
                    </Button>
                    <Button onClick={this.props.onOK} color="primary">OK</Button>
                </DialogActions>
                {showDiff ? <DiffViewer gmeClient={gmeClient} oldRootHash={diffWithRoot} onOK={this.closeDiff}/> : null}
            </Dialog>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProjectHistory);
