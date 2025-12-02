# Feature Flag Rollout Plan: ElevenLabs Agent Integration

## Overview

This document outlines the incremental rollout plan for the ElevenLabs Agent feature across development, staging, and production environments. The feature is controlled by feature flags in three services:

- **jarek-va-ui**: `VITE_ELEVENLABS_AGENT_ENABLED`
- **cursor-runner**: `ELEVENLABS_AGENT_ENABLED`
- **elevenlabs-agent**: `ELEVENLABS_AGENT_ENABLED`

## Environment Combinations

### Initial State (All Environments)

All environments start with the feature **disabled**:

| Service | Environment Variable | Value |
|---------|---------------------|-------|
| jarek-va-ui | `VITE_ELEVENLABS_AGENT_ENABLED` | `false` |
| cursor-runner | `ELEVENLABS_AGENT_ENABLED` | `false` |
| elevenlabs-agent | `ELEVENLABS_AGENT_ENABLED` | `false` |

### Development Environment

**Purpose**: Initial testing and validation

| Service | Environment Variable | Value |
|---------|---------------------|-------|
| jarek-va-ui | `VITE_ELEVENLABS_AGENT_ENABLED` | `true` |
| cursor-runner | `ELEVENLABS_AGENT_ENABLED` | `true` |
| elevenlabs-agent | `ELEVENLABS_AGENT_ENABLED` | `true` |

**When to Enable**: After all unit and integration tests pass, and manual smoke testing is complete.

### Staging Environment

**Purpose**: Production-like testing and validation

| Service | Environment Variable | Value |
|---------|---------------------|-------|
| jarek-va-ui | `VITE_ELEVENLABS_AGENT_ENABLED` | `true` |
| cursor-runner | `ELEVENLABS_AGENT_ENABLED` | `true` |
| elevenlabs-agent | `ELEVENLABS_AGENT_ENABLED` | `true` |

**When to Enable**: After successful validation in development for at least 48 hours with no critical issues.

### Production Environment

**Purpose**: Live user-facing deployment

| Service | Environment Variable | Value |
|---------|---------------------|-------|
| jarek-va-ui | `VITE_ELEVENLABS_AGENT_ENABLED` | `true` |
| cursor-runner | `ELEVENLABS_AGENT_ENABLED` | `true` |
| elevenlabs-agent | `ELEVENLABS_AGENT_ENABLED` | `true` |

**When to Enable**: After successful validation in staging for at least 7 days with no critical issues, and after team approval.

## Rollout Steps

### Phase 1: Development Environment

1. **Pre-Deployment Checklist**:
   - [ ] All automated tests pass
   - [ ] Code review completed
   - [ ] Feature flag infrastructure verified
   - [ ] Documentation updated

2. **Deployment Steps**:
   ```bash
   # Update .env or docker-compose.yml for development
   # Set VITE_ELEVENLABS_AGENT_ENABLED=true (jarek-va-ui)
   # Set ELEVENLABS_AGENT_ENABLED=true (cursor-runner)
   # Set ELEVENLABS_AGENT_ENABLED=true (elevenlabs-agent)
   ```

3. **Verification Steps**:
   - [ ] Verify feature flag is enabled in all three services
   - [ ] Test agent conversation creation
   - [ ] Test voice interaction flow
   - [ ] Verify UI elements are visible
   - [ ] Check logs for errors
   - [ ] Monitor for 24 hours

4. **Success Criteria**:
   - No critical errors in logs
   - All smoke tests pass
   - Feature functions as expected
   - No performance degradation

### Phase 2: Staging Environment

1. **Pre-Deployment Checklist**:
   - [ ] Development validation successful (48+ hours)
   - [ ] No critical issues reported
   - [ ] Staging environment matches production configuration
   - [ ] Monitoring and alerting configured

2. **Deployment Steps**:
   ```bash
   # Update staging environment variables
   # Set VITE_ELEVENLABS_AGENT_ENABLED=true (jarek-va-ui)
   # Set ELEVENLABS_AGENT_ENABLED=true (cursor-runner)
   # Set ELEVENLABS_AGENT_ENABLED=true (elevenlabs-agent)
   # Rebuild and redeploy services
   ```

3. **Verification Steps**:
   - [ ] Verify feature flag is enabled in all three services
   - [ ] Run full integration test suite
   - [ ] Perform end-to-end testing
   - [ ] Load testing (if applicable)
   - [ ] Security review
   - [ ] Monitor for 7 days

4. **Success Criteria**:
   - All integration tests pass
   - No critical errors in logs
   - Performance metrics within acceptable range
   - Security review passed
   - No user-reported issues

### Phase 3: Production Environment

1. **Pre-Deployment Checklist**:
   - [ ] Staging validation successful (7+ days)
   - [ ] Team approval obtained
   - [ ] Rollback plan reviewed and tested
   - [ ] On-call engineer available
   - [ ] Monitoring dashboards ready
   - [ ] Communication plan executed (if needed)

2. **Deployment Steps**:
   ```bash
   # Update production environment variables
   # Set VITE_ELEVENLABS_AGENT_ENABLED=true (jarek-va-ui)
   # Set ELEVENLABS_AGENT_ENABLED=true (cursor-runner)
   # Set ELEVENLABS_AGENT_ENABLED=true (elevenlabs-agent)
   # Rebuild and redeploy services
   # Verify deployment successful
   ```

3. **Verification Steps**:
   - [ ] Verify feature flag is enabled in all three services
   - [ ] Smoke test in production
   - [ ] Monitor error rates
   - [ ] Monitor performance metrics
   - [ ] Check user feedback channels
   - [ ] Monitor for 24 hours continuously

4. **Success Criteria**:
   - No increase in error rates
   - Performance metrics stable
   - No critical user-reported issues
   - Feature accessible and functional

## Rollback Strategy

### Quick Rollback (Feature Flag Only)

**Use Case**: Feature flag rollback when issues are detected but services are stable.

**Steps**:
1. Set all feature flags to `false`:
   ```bash
   # jarek-va-ui
   VITE_ELEVENLABS_AGENT_ENABLED=false
   
   # cursor-runner
   ELEVENLABS_AGENT_ENABLED=false
   
   # elevenlabs-agent
   ELEVENLABS_AGENT_ENABLED=false
   ```
2. Rebuild and redeploy affected services
3. Verify feature is disabled (UI hidden, routes return 503)
4. Monitor for stability

**Time to Rollback**: ~5-10 minutes

### Full Rollback (Code Deployment)

**Use Case**: Critical issues requiring code rollback.

**Steps**:
1. Revert to previous code version
2. Set feature flags to `false`
3. Rebuild and redeploy all services
4. Verify system stability
5. Investigate root cause

**Time to Rollback**: ~15-30 minutes

### Traefik Route Disabling (Emergency)

**Use Case**: Immediate traffic blocking if critical security or stability issues occur.

**Steps**:
1. Disable Traefik routes for agent-related endpoints:
   ```yaml
   # In Traefik configuration, disable routes:
   # - /agent-conversations/*
   # - /agent-conversations/api/*
   ```
2. Set feature flags to `false`
3. Rebuild and redeploy
4. Investigate and resolve issues

**Time to Rollback**: ~2-5 minutes

## Monitoring Plan

### Key Metrics to Monitor

1. **Error Rates**:
   - API error rates (4xx, 5xx)
   - Service error logs
   - Client-side errors

2. **Performance Metrics**:
   - API response times
   - Service latency
   - Resource utilization (CPU, memory)

3. **Feature Usage**:
   - Number of agent conversations created
   - Voice interaction success rate
   - User engagement metrics

4. **System Health**:
   - Service availability
   - Database connection health
   - Redis connection health
   - External API (ElevenLabs) health

### Alerting Thresholds

- **Critical**: Error rate > 5% for 5 minutes
- **Warning**: Error rate > 2% for 10 minutes
- **Critical**: Response time > 5 seconds (p95)
- **Warning**: Response time > 2 seconds (p95)
- **Critical**: Service unavailable for > 1 minute

## Success Criteria

### Development
- ✅ All automated tests pass
- ✅ Manual smoke testing successful
- ✅ No critical errors for 24 hours
- ✅ Feature functions as expected

### Staging
- ✅ All integration tests pass
- ✅ End-to-end testing successful
- ✅ Performance metrics acceptable
- ✅ Security review passed
- ✅ No critical issues for 7 days

### Production
- ✅ No increase in error rates
- ✅ Performance metrics stable
- ✅ Feature accessible and functional
- ✅ Positive user feedback
- ✅ No critical issues for 30 days

## Risk Mitigation

### Identified Risks

1. **Production Issues**:
   - **Mitigation**: Gradual rollout, comprehensive testing, monitoring, quick rollback capability

2. **Rollback Failures**:
   - **Mitigation**: Test rollback procedure in staging, document steps, practice rollback

3. **Environment Differences**:
   - **Mitigation**: Production-like staging environment, comprehensive testing, monitoring

4. **Feature Flag Misconfiguration**:
   - **Mitigation**: Automated tests verify flag behavior, documentation, validation scripts

### Contingency Plans

- **If issues in development**: Disable flags, investigate, fix, and retry
- **If issues in staging**: Disable flags, investigate, fix, and retry before production
- **If issues in production**: Immediate rollback, investigate, fix, and retry after validation

## Team Training

### Required Knowledge

1. **Feature Flag Management**:
   - How to enable/disable flags
   - How to verify flag status
   - How to test flag behavior

2. **Rollback Procedures**:
   - Quick rollback (flags only)
   - Full rollback (code deployment)
   - Emergency route disabling

3. **Monitoring and Alerting**:
   - How to access monitoring dashboards
   - How to interpret metrics
   - How to respond to alerts

### Training Resources

- This rollout plan document
- Feature flag documentation
- Monitoring dashboard access
- Rollback procedure runbooks

## Communication Plan

### Internal Communication

- **Development Phase**: Team chat updates
- **Staging Phase**: Team email with status
- **Production Phase**: Team email + optional standup announcement

### External Communication (if needed)

- User-facing changes: Release notes or announcement
- API changes: API documentation updates

## Timeline Estimate

- **Development Validation**: 2-3 days
- **Staging Validation**: 7-10 days
- **Production Rollout**: 1 day
- **Post-Production Monitoring**: 30 days

**Total Estimated Timeline**: ~40-44 days from development to full production validation

## Notes

- All feature flags default to `false` to ensure safe dark releases
- Feature flags can be toggled independently per service if needed for debugging
- Monitor closely during first 24 hours after each phase
- Document any issues or learnings for future rollouts
