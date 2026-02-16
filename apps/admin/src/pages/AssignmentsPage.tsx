import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Trans } from '@lingui/macro';
import { Id } from 'convex/_generated/dataModel';

function AssignmentsPage() {
    const [selectedTask, setSelectedTask] = useState<Id<"tasks"> | null>(null);

    const activeSeason = useQuery(api.seasons.getActive);
    const activeGroups = useQuery(api.groups.listActive);
    const tasks = useQuery(api.tasks.list, { status: 'Active' });

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title"><Trans>Task Assignments</Trans></h1>
            </div>

            {!activeSeason ? (
                <div className="card">
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                        <Trans>No active season. Create and activate a season to assign tasks.</Trans>
                    </p>
                </div>
            ) : (
                <>
                    <div className="card" style={{ marginBottom: 'var(--spacing-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                            <div>
                                <h3 style={{ margin: 0 }}><Trans>Active Season:</Trans> {activeSeason.name}</h3>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                                    {new Date(activeSeason.startDate).toLocaleDateString()} - {new Date(activeSeason.endDate).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}><Trans>Select Task to Assign</Trans></h3>
                        {tasks === undefined ? (
                            <div className="loading">
                                <div className="spinner"></div>
                            </div>
                        ) : tasks.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)' }}>
                                <Trans>No active tasks available. Create a task first.</Trans>
                            </p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
                                {tasks.map((task) => (
                                    <div
                                        key={task._id}
                                        className={`card ${selectedTask === task._id ? 'card-selected' : ''}`}
                                        style={{ cursor: 'pointer', padding: 'var(--spacing-md)' }}
                                        onClick={() => setSelectedTask(task._id)}
                                    >
                                        <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                                            {task.title}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {task.type} • {task.difficulty}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                                            {task.description.substring(0, 60)}...
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedTask && activeGroups && (
                        <AssignToGroupsSection
                            taskId={selectedTask}
                            groups={activeGroups}
                        />
                    )}
                </>
            )}
        </div>
    );
}

function AssignToGroupsSection({
    taskId,
    groups,
}: {
    taskId: Id<"tasks">;
    groups: Array<{
        _id: Id<"groups">;
        participant1Name: string;
        participant2Name: string;
        participant3Name?: string;
        participant4Name?: string;
        weekInSeason?: number;
        taskId?: Id<"tasks">;
    }>;
}) {
    const [selectedGroups, setSelectedGroups] = useState<Set<Id<"groups">>>(new Set());
    const assignToGroups = useMutation(api.taskAssignments.assignToGroups);
    const [isAssigning, setIsAssigning] = useState(false);

    const handleToggleGroup = (groupId: Id<"groups">) => {
        const newSet = new Set(selectedGroups);
        if (newSet.has(groupId)) {
            newSet.delete(groupId);
        } else {
            newSet.add(groupId);
        }
        setSelectedGroups(newSet);
    };

    const handleAssign = async () => {
        if (selectedGroups.size === 0) {
            alert('Please select at least one group');
            return;
        }

        if (!confirm(`Assign this task to ${selectedGroups.size} group(s)?`)) return;

        setIsAssigning(true);
        try {
            const count = await assignToGroups({
                groupIds: Array.from(selectedGroups),
                taskId,
            });
            alert(`Successfully assigned task to ${count} group(s)!`);
            setSelectedGroups(new Set());
        } catch (error) {
            alert(`Error: ${error}`);
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                <h3 style={{ margin: 0 }}>
                    <Trans>Select Groups</Trans> ({selectedGroups.size} <Trans>selected</Trans>)
                </h3>
                <button
                    className="btn btn-primary"
                    onClick={handleAssign}
                    disabled={isAssigning || selectedGroups.size === 0}
                >
                    {isAssigning ? <Trans>Assigning...</Trans> : <Trans>Assign to Selected Groups</Trans>}
                </button>
            </div>

            {groups.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>
                    <Trans>No active groups found.</Trans>
                </p>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedGroups(new Set(groups.map(g => g._id)));
                                            } else {
                                                setSelectedGroups(new Set());
                                            }
                                        }}
                                        checked={selectedGroups.size === groups.length && groups.length > 0}
                                    />
                                </th>
                                <th><Trans>Members</Trans></th>
                                <th><Trans>Week</Trans></th>
                                <th><Trans>Current Task</Trans></th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((group) => (
                                <tr key={group._id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedGroups.has(group._id)}
                                            onChange={() => handleToggleGroup(group._id)}
                                        />
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.875rem' }}>
                                            {group.participant1Name}, {group.participant2Name}
                                            {group.participant3Name && `, ${group.participant3Name}`}
                                            {group.participant4Name && `, ${group.participant4Name}`}
                                        </div>
                                    </td>
                                    <td>
                                        {group.weekInSeason ? `Week ${group.weekInSeason}` : '-'}
                                    </td>
                                    <td>
                                        {group.taskId ? (
                                            <span style={{ color: 'var(--color-warning)' }}>
                                                <Trans>Already assigned</Trans>
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AssignmentsPage;
