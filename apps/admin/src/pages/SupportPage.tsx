import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';

function SupportPage() {
    const [statusFilter, setStatusFilter] = useState<string>('Open');

    const tickets = useQuery(api.support.list, {
        status: statusFilter || undefined,
    });

    const answerTicket = useMutation(api.support.answerTicket);
    const closeTicket = useMutation(api.support.closeTicket);

    const [selectedTicket, setSelectedTicket] = useState<Id<'supportTickets'> | null>(null);
    const [answer, setAnswer] = useState('');

    const handleAnswer = async () => {
        if (!selectedTicket || !answer.trim()) return;

        try {
            await answerTicket({ ticketId: selectedTicket, answer });
            setSelectedTicket(null);
            setAnswer('');
        } catch (error) {
            console.error('Failed to answer ticket:', error);
            alert('Failed to answer ticket');
        }
    };

    const handleClose = async (ticketId: Id<'supportTickets'>) => {
        try {
            await closeTicket({ ticketId });
        } catch (error) {
            console.error('Failed to close ticket:', error);
            alert('Failed to close ticket');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Support Tickets</h1>
                <span style={{ color: 'var(--text-secondary)' }}>
                    {tickets?.length || 0} tickets
                </span>
            </div>

            <div className="filter-bar">
                <div className="filter-group">
                    <label className="filter-label">Status:</label>
                    <select
                        className="input"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All</option>
                        <option value="Open">Open</option>
                        <option value="Answered">Answered</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
            </div>

            <div className="card">
                {tickets === undefined ? (
                    <div className="loading">
                        <div className="spinner"></div>
                    </div>
                ) : tickets.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                        No tickets found.
                    </p>
                ) : (
                    <div>
                        {tickets.map((ticket) => (
                            <div
                                key={ticket._id}
                                style={{
                                    padding: 'var(--spacing-md)',
                                    borderBottom: '1px solid var(--border-color)',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                                    <div>
                                        <span style={{ fontWeight: 500 }}>
                                            {ticket.participantName || 'Unknown User'}
                                        </span>
                                        <span style={{ color: 'var(--text-secondary)', marginLeft: 'var(--spacing-sm)', fontSize: '0.875rem' }}>
                                            ({ticket.telegramId})
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                        <span className={`badge badge-${ticket.status.toLowerCase()}`}>
                                            {ticket.status}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <p style={{ marginBottom: 'var(--spacing-sm)' }}>{ticket.question}</p>

                                {ticket.answer && (
                                    <div style={{
                                        background: 'var(--bg-primary)',
                                        padding: 'var(--spacing-sm)',
                                        borderRadius: 'var(--radius-sm)',
                                        marginBottom: 'var(--spacing-sm)',
                                    }}>
                                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Answer: </span>
                                        <span style={{ fontSize: '0.875rem' }}>{ticket.answer}</span>
                                    </div>
                                )}

                                {selectedTicket === ticket._id ? (
                                    <div style={{ marginTop: 'var(--spacing-sm)' }}>
                                        <textarea
                                            className="input"
                                            rows={3}
                                            value={answer}
                                            onChange={(e) => setAnswer(e.target.value)}
                                            placeholder="Type your answer..."
                                            style={{ marginBottom: 'var(--spacing-sm)' }}
                                        />
                                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                            <button className="btn btn-primary" onClick={handleAnswer}>
                                                Send Answer
                                            </button>
                                            <button className="btn btn-secondary" onClick={() => { setSelectedTicket(null); setAnswer(''); }}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                        {ticket.status === 'Open' && (
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => setSelectedTicket(ticket._id)}
                                            >
                                                Answer
                                            </button>
                                        )}
                                        {ticket.status !== 'Closed' && (
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => handleClose(ticket._id)}
                                            >
                                                Close
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SupportPage;
