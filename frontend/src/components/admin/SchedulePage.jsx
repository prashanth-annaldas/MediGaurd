import React from 'react';
import Layout from '../layout/Layout';
import ScheduleManager from './ScheduleManager';

export default function SchedulePage() {
    return (
        <Layout title="Doctor Schedules">
            <ScheduleManager />
        </Layout>
    );
}
