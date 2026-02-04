/**
 * State Store Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getState, setState, subscribe, resetState, actions } from '../src/stores/state.js';

describe('State Store', () => {
  beforeEach(() => {
    resetState();
  });
  
  describe('getState', () => {
    it('should return current state', () => {
      const state = getState();
      expect(state).toBeDefined();
      expect(state.activeTab).toBe('map');
      expect(state.lang).toBe('fr');
    });
    
    it('should return a copy, not the original state', () => {
      const state1 = getState();
      const state2 = getState();
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });
  
  describe('setState', () => {
    it('should update state with partial updates', () => {
      setState({ activeTab: 'spots' });
      const state = getState();
      expect(state.activeTab).toBe('spots');
    });
    
    it('should preserve other state properties', () => {
      const initialLang = getState().lang;
      setState({ activeTab: 'spots' });
      expect(getState().lang).toBe(initialLang);
    });
    
    it('should handle multiple updates', () => {
      setState({ activeTab: 'spots' });
      setState({ viewMode: 'map' });
      const state = getState();
      expect(state.activeTab).toBe('spots');
      expect(state.viewMode).toBe('map');
    });
  });
  
  describe('subscribe', () => {
    it('should call subscriber with current state immediately', () => {
      const callback = vi.fn();
      subscribe(callback);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        activeTab: 'map',
      }));
    });
    
    it('should call subscriber on state changes', () => {
      const callback = vi.fn();
      subscribe(callback);
      callback.mockClear();
      
      setState({ activeTab: 'spots' });
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        activeTab: 'spots',
      }));
    });
    
    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = subscribe(callback);
      callback.mockClear();
      
      unsubscribe();
      setState({ activeTab: 'spots' });
      
      expect(callback).not.toHaveBeenCalled();
    });
  });
  
  describe('resetState', () => {
    it('should reset state to initial values', () => {
      setState({ 
        activeTab: 'spots', 
        points: 100,
        username: 'TestUser'
      });
      
      resetState();
      
      const state = getState();
      expect(state.activeTab).toBe('map');
      expect(state.points).toBe(0);
      expect(state.username).toBe('');
    });
  });
  
  describe('actions', () => {
    describe('changeTab', () => {
      it('should change active tab', () => {
        actions.changeTab('spots');
        expect(getState().activeTab).toBe('spots');
      });
      
      it('should clear selected spot when changing tab', () => {
        setState({ selectedSpot: { id: 1 } });
        actions.changeTab('chat');
        expect(getState().selectedSpot).toBeNull();
      });
    });
    
    describe('toggleTheme', () => {
      it('should toggle from dark to light', () => {
        setState({ theme: 'dark' });
        actions.toggleTheme();
        expect(getState().theme).toBe('light');
      });
      
      it('should toggle from light to dark', () => {
        setState({ theme: 'light' });
        actions.toggleTheme();
        expect(getState().theme).toBe('dark');
      });
    });
    
    describe('addPoints', () => {
      it('should add points', () => {
        actions.addPoints(50);
        expect(getState().points).toBe(50);
      });
      
      it('should update level when reaching 100 points', () => {
        actions.addPoints(100);
        expect(getState().level).toBe(2);
      });
      
      it('should accumulate points', () => {
        actions.addPoints(30);
        actions.addPoints(40);
        expect(getState().points).toBe(70);
      });
    });
    
    describe('incrementCheckins', () => {
      it('should increment checkins', () => {
        actions.incrementCheckins();
        expect(getState().checkins).toBe(1);
      });
      
      it('should also add points', () => {
        actions.incrementCheckins();
        expect(getState().points).toBe(5);
      });
    });
    
    describe('addBadge', () => {
      it('should add badge if not already present', () => {
        actions.addBadge('FirstSpot');
        expect(getState().badges).toContain('FirstSpot');
      });
      
      it('should not add duplicate badges', () => {
        actions.addBadge('FirstSpot');
        actions.addBadge('FirstSpot');
        expect(getState().badges.filter(b => b === 'FirstSpot').length).toBe(1);
      });
      
      it('should add points when earning badge', () => {
        actions.addBadge('FirstSpot');
        expect(getState().points).toBe(50);
      });
    });
    
    describe('tutorial actions', () => {
      it('nextTutorialStep should increment step', () => {
        setState({ tutorialStep: 0 });
        actions.nextTutorialStep();
        expect(getState().tutorialStep).toBe(1);
      });
      
      it('nextTutorialStep should close tutorial at last step', () => {
        setState({ tutorialStep: 7, showTutorial: true });
        actions.nextTutorialStep();
        expect(getState().showTutorial).toBe(false);
        expect(getState().tutorialStep).toBe(0);
      });
      
      it('prevTutorialStep should decrement step', () => {
        setState({ tutorialStep: 3 });
        actions.prevTutorialStep();
        expect(getState().tutorialStep).toBe(2);
      });
      
      it('skipTutorial should close tutorial', () => {
        setState({ showTutorial: true, tutorialStep: 3 });
        actions.skipTutorial();
        expect(getState().showTutorial).toBe(false);
      });
    });
  });
});
