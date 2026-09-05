import { useEffect } from 'react';
import { runBatch } from '../lib/api';

export function Dashboard() {
  useEffect(() => {
    // Verification: run batch and log result
    console.log('Testing RecoverAI API: Triggering batch run...');
    runBatch(5)
      .then((res) => {
        console.log('Batch run result:', res);
      })
      .catch((err) => {
        console.error('Batch run error:', err);
      });
  }, []);

  return (
    <div>
      <h2>Dashboard Page</h2>
      <p>RecoverAI Payment Recovery Overview</p>
    </div>
  );
}

export default Dashboard;
