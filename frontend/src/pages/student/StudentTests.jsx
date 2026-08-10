import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { 
  ClipboardList, Clock, CheckCircle2, XCircle, Play, 
  AlertCircle, ShieldAlert, Award, Calendar, RefreshCw, Lock, Terminal
} from 'lucide-react';

const StudentTests = () => {
  const [activeTests, setActiveTests] = useState([]);
  const [upcomingTests, setUpcomingTests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [history, setHistory] = useState([]);

  // Coding state
  const [activeCoding, setActiveCoding] = useState([]);
  const [completedCoding, setCompletedCoding] = useState([]);
  const [codingHistory, setCodingHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('active'); // active, upcoming, completed, history

  const fetchTestsData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch Aptitude
      const aptRes = await api.get('/student/tests');
      setActiveTests(aptRes.data.active);
      setUpcomingTests(aptRes.data.upcoming);
      setCompletedTests(aptRes.data.completed);
      setHistory(aptRes.data.history);

      // Fetch Coding
      const codRes = await api.get('/student/coding-assessments');
      const codingAssessments = codRes.data || [];
      
      const activeCod = [];
      const completedCod = [];
      const historyCod = [];

      codingAssessments.forEach(ass => {
        const latestAttempt = ass.attempts?.[0];
        const isCompleted = latestAttempt && latestAttempt.status !== 'IN_PROGRESS';
        
        if (isCompleted) {
          completedCod.push(ass);
        } else {
          activeCod.push(ass);
        }

        if (ass.attempts && ass.attempts.length > 0) {
          ass.attempts.forEach(att => {
            historyCod.push({
              ...att,
              assessmentName: ass.name,
              duration: ass.duration
            });
          });
        }
      });

      setActiveCoding(activeCod);
      setCompletedCoding(completedCod);
      setCodingHistory(historyCod);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestsData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalActive = activeTests.length + activeCoding.length;
  const totalCompleted = completedTests.length + completedCoding.length;
  const totalHistory = history.length + codingHistory.length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold mb-1">My Assessments</h1>
        <p className="text-muted-foreground">Complete mandatory online tests assigned for your job applications</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 flex-wrap w-fit">
        <button 
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'active' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Active ({totalActive})
        </button>
        <button 
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'upcoming' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Upcoming ({upcomingTests.length})
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'completed' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Completed ({totalCompleted})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'history' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Attempt History ({totalHistory})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        
        {/* ACTIVE TAB */}
        {activeTab === 'active' && (
          totalActive === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
              <ClipboardList size={36} className="mx-auto mb-3 opacity-30 text-primary" />
              <p className="font-semibold text-foreground">No active assessments assigned</p>
              <p className="text-xs mt-1">Once you apply to a job that has assessments, they will appear here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Aptitude Section */}
              {activeTests.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ClipboardList size={14} /> Aptitude Tests
                  </h2>
                  <div className="grid gap-4">
                    {activeTests.map(test => {
                      const attemptsTaken = test.attempts.length;
                      const inProgressAttempt = test.attempts.find(a => a.status === 'IN_PROGRESS');
                      const hasStarted = !!inProgressAttempt;

                      return (
                        <div key={test.id} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md hover:border-primary/20 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-lg text-foreground truncate">{test.name}</h3>
                              {hasStarted && (
                                <span className="text-[10px] px-2 py-0.5 bg-yellow-500/10 text-yellow-600 rounded-full font-bold animate-pulse">
                                  In Progress
                                </span>
                              )}
                            </div>
                            {test.description && <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{test.description}</p>}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                              <span className="flex items-center gap-1"><Clock size={13} />{test.duration} minutes</span>
                              <span className="flex items-center gap-1"><Award size={13} />Passing Score: {test.passingPercentage}%</span>
                              <span className="flex items-center gap-1"><ShieldAlert size={13} />Attempts: {attemptsTaken} / {test.maxAttempts}</span>
                            </div>
                            {test.jobs?.length > 0 && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium pt-1">
                                <span>Job Posting:</span>
                                <span className="px-2 py-0.5 bg-primary/5 text-primary border border-primary/10 rounded font-semibold text-[10px]">{test.jobs[0].title}</span>
                              </div>
                            )}
                          </div>
                          
                          <Link 
                            to={`/student/tests/${test.id}/attempt`}
                            className="w-full sm:w-auto px-5 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/95 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
                          >
                            <Play size={14} />
                            {hasStarted ? 'Resume Test' : 'Start Test'}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Coding Section */}
              {activeCoding.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Terminal size={14} /> Coding Assessments
                  </h2>
                  <div className="grid gap-4">
                    {activeCoding.map(ass => {
                      const isLocked = !ass.prerequisite?.passed;
                      const hasStarted = ass.attempts?.some(a => a.status === 'IN_PROGRESS');

                      return (
                        <div key={ass.id} className={`bg-card border border-border rounded-2xl p-6 hover:shadow-md hover:border-primary/20 transition-all ${isLocked ? 'opacity-70 bg-muted/10' : ''}`}>
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-lg text-foreground truncate">{ass.name}</h3>
                                {isLocked && (
                                  <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-600 rounded-full font-bold flex items-center gap-1">
                                    <Lock size={10} /> Locked
                                  </span>
                                )}
                                {!isLocked && hasStarted && (
                                  <span className="text-[10px] px-2 py-0.5 bg-yellow-500/10 text-yellow-600 rounded-full font-bold animate-pulse">
                                    In Progress
                                  </span>
                                )}
                              </div>
                              {ass.description && <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{ass.description}</p>}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                                <span className="flex items-center gap-1"><Clock size={13} />{ass.duration} minutes</span>
                              </div>
                              {ass.jobs?.length > 0 && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium pt-1">
                                  <span>Job Posting:</span>
                                  <span className="px-2 py-0.5 bg-secondary/15 text-secondary-foreground border border-secondary/20 rounded font-semibold text-[10px]">{ass.jobs[0].title}</span>
                                </div>
                              )}
                            </div>

                            {isLocked ? (
                              <button 
                                disabled
                                className="w-full sm:w-auto px-5 py-3 bg-muted text-muted-foreground border font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-not-allowed shrink-0"
                              >
                                <Lock size={14} /> Locked
                              </button>
                            ) : (
                              <Link 
                                to={`/student/coding-assessments/${ass.id}/attempt`}
                                className="w-full sm:w-auto px-5 py-3 bg-secondary text-secondary-foreground font-bold text-sm rounded-xl hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
                              >
                                <Play size={14} />
                                {hasStarted ? 'Resume Coding' : 'Start Coding'}
                              </Link>
                            )}
                          </div>

                          {/* Progression tracker */}
                          <div className="border-t border-border/40 pt-4 mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs font-semibold text-muted-foreground">
                            <span>Assessment Progress:</span>
                            <div className="flex items-center gap-2 flex-wrap">
                              {ass.prerequisite?.passed ? (
                                <span className="flex items-center gap-1 text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                                  ✓ Aptitude Passed {ass.prerequisite.percentage && `(${ass.prerequisite.percentage}%)`}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                  ✗ Aptitude Not Passed {ass.prerequisite?.details && `(${ass.prerequisite.details})`}
                                </span>
                              )}
                              <span>→</span>
                              {ass.prerequisite?.passed ? (
                                <span className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                  Coding Available
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                                  Coding Locked
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* UPCOMING TAB */}
        {activeTab === 'upcoming' && (
          upcomingTests.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
              <Calendar size={36} className="mx-auto mb-3 opacity-30 text-primary" />
              <p className="font-semibold text-foreground">No upcoming tests scheduled</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {upcomingTests.map(test => (
                <div key={test.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2 flex-1">
                    <h3 className="font-bold text-lg text-foreground">{test.name}</h3>
                    {test.description && <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{test.description}</p>}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                      <span className="flex items-center gap-1"><Clock size={13} />{test.duration} minutes</span>
                      {test.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={13} /> 
                          Starts: {new Date(test.startDate).toLocaleDateString()} at {new Date(test.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    disabled 
                    className="w-full sm:w-auto px-5 py-3 bg-muted text-muted-foreground font-bold text-sm rounded-xl cursor-not-allowed shrink-0"
                  >
                    Scheduled
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* COMPLETED TAB */}
        {activeTab === 'completed' && (
          totalCompleted === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
              <CheckCircle2 size={36} className="mx-auto mb-3 opacity-30 text-primary" />
              <p className="font-semibold text-foreground">No completed tests</p>
            </div>
          ) : (
            <div className="space-y-6">
              {completedTests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aptitude Tests</h3>
                  <div className="grid gap-4">
                    {completedTests.map(test => (
                      <div key={test.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 opacity-80">
                        <div className="space-y-2 flex-1">
                          <h3 className="font-bold text-lg text-foreground">{test.name}</h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1"><Clock size={13} />{test.duration} minutes</span>
                            <span className="flex items-center gap-1"><Award size={13} />Passing: {test.passingPercentage}%</span>
                          </div>
                        </div>
                        <div className="w-full sm:w-auto px-5 py-2.5 bg-green-500/10 text-green-600 font-bold text-sm rounded-xl border border-green-500/20 text-center shrink-0">
                          Finished / Expired
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {completedCoding.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Coding Assessments</h3>
                  <div className="grid gap-4">
                    {completedCoding.map(ass => (
                      <div key={ass.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 opacity-80">
                        <div className="space-y-2 flex-1">
                          <h3 className="font-bold text-lg text-foreground">{ass.name}</h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1"><Clock size={13} />{ass.duration} minutes</span>
                          </div>
                        </div>
                        <div className="w-full sm:w-auto px-5 py-2.5 bg-green-500/10 text-green-600 font-bold text-sm rounded-xl border border-green-500/20 text-center shrink-0">
                          Completed
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* ATTEMPT HISTORY TAB */}
        {activeTab === 'history' && (
          totalHistory === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
              <RefreshCw size={36} className="mx-auto mb-3 opacity-30 text-primary" />
              <p className="font-semibold text-foreground">No attempt history recorded</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Aptitude attempts */}
              {history.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aptitude Attempt History</h3>
                  <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border shadow-sm">
                    {history.map((att) => (
                      <div key={att.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-foreground truncate">{att.test?.name}</h4>
                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium capitalize">
                              {att.status.replace('_', ' ').toLowerCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                            <span>Submitted: {new Date(att.completedAt || att.startedAt).toLocaleDateString()}</span>
                            <span>Time Taken: {Math.round(att.timeTaken / 60) || 0}m {att.timeTaken % 60 || 0}s</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 text-sm">
                          <div className="text-right">
                            <p className="font-bold text-base">{att.score} marks</p>
                            <p className="text-xs text-muted-foreground">{att.percentage.toFixed(1)}%</p>
                          </div>

                          <div className="font-bold text-xs shrink-0">
                            {att.passed ? (
                              <span className="flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-600 rounded-full border border-green-500/20">
                                <CheckCircle2 size={13} /> Pass
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-600 rounded-full border border-red-500/20">
                                <XCircle size={13} /> Fail
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coding attempts */}
              {codingHistory.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Coding Attempt History</h3>
                  <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border shadow-sm">
                    {codingHistory.map((att) => (
                      <div key={att.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-foreground truncate">{att.assessmentName}</h4>
                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium capitalize">
                              {att.status.replace('_', ' ').toLowerCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                            <span>Submitted: {new Date(att.completedAt || att.startedAt).toLocaleDateString()}</span>
                            {att.timeTaken && (
                              <span>Time Taken: {Math.round(att.timeTaken / 60) || 0}m {att.timeTaken % 60 || 0}s</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 text-sm">
                          <div className="text-right">
                            <p className="font-bold text-base">{att.score} marks</p>
                          </div>
                          
                          <div className="font-bold text-xs shrink-0">
                            <span className="flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-600 rounded-full border border-green-500/20">
                              <CheckCircle2 size={13} /> Submitted
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default StudentTests;
