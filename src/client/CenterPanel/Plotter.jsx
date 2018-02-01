import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import SIM_RES from '../LeftPanel/SIM_RES.json';
import colorHash from '../gme/utils/colorHash';

import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend} from 'recharts';

const mapStateToProps = state => {
    return {
        variables: state.plotData.variables
    }
};

const mapDispatchToProps = dispatch => {
    return {}
};

class Plotter extends Component {
    render() {
        const data = [];
        const {variables} = this.props;

        SIM_RES.timeSeries.time.forEach((time, idx) => {
            let plotPoints = {
                time: time
            };

            variables.forEach(varName => {
                plotPoints[varName] = SIM_RES.timeSeries[varName][idx]
            });

            data.push(plotPoints);
        });

        return (
            <div>
                <LineChart width={300} height={200} data={data}>
                <XAxis dataKey="time"/>
                <YAxis/>
                <CartesianGrid strokeDasharray="3 3"/>
                <Tooltip/>
                <Legend />
                {data[0] ?
                    Object.keys(data[0])
                        .filter(varName => varName !== 'time')
                        .map(varName => {
                            return <Line key={varName} type="monotone" dataKey={varName} stroke={colorHash(varName).rgb}/>
                        })
                    : null}
                </LineChart>
            </div>
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Plotter);