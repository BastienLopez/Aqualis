package com.aquarium.premium.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aquarium.premium.data.entity.ActiveTimerEntity
import com.aquarium.premium.data.entity.SessionEntity
import com.aquarium.premium.data.repository.AquariumRepository
import com.aquarium.premium.model.RewardCalculator
import com.aquarium.premium.model.SessionType
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.UUID

data class SessionUiState(
    val activeTimer: ActiveTimerEntity? = null,
    val remainingMillis: Long = 0,
    val isRunning: Boolean = false,
    val isCompleted: Boolean = false,
    val earnedGold: Int = 0,
    val calmPhase: Boolean = false,
    val lastCompletedDuration: Int? = null
)

class SessionViewModel(private val repository: AquariumRepository) : ViewModel() {
    private val remainingMillis = MutableStateFlow(0L)
    private val completionGold = MutableStateFlow(0)
    private val isCompleted = MutableStateFlow(false)
    private val calmPhase = MutableStateFlow(false)
    private val lastCompletedDuration = MutableStateFlow<Int?>(null)
    private var tickerJob: Job? = null
    val uiState: StateFlow<SessionUiState> = combine(
        repository.activeTimer,
        remainingMillis,
        isCompleted,
        completionGold,
        calmPhase,
        lastCompletedDuration
    ) { timer, remaining, completed, gold, calm, duration ->
        SessionUiState(
            activeTimer = timer,
            remainingMillis = remaining,
            isRunning = timer?.isRunning == true,
            isCompleted = completed,
            earnedGold = gold,
            calmPhase = calm,
            lastCompletedDuration = duration
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), SessionUiState())

    init {
        viewModelScope.launch {
            repository.activeTimer.collect { timer ->
                if (timer != null) startTicker(timer) else stopTicker()
            }
        }
    }

    fun startSession(type: SessionType, durationMinutes: Int) {
        if (uiState.value.isRunning) return
        viewModelScope.launch {
            repository.startTimer(type, durationMinutes)
        }
    }

    fun dismissCompletion() {
        viewModelScope.launch {
            isCompleted.emit(false)
            completionGold.emit(0)
            lastCompletedDuration.emit(null)
        }
    }

    private fun startTicker(timer: ActiveTimerEntity) {
        tickerJob?.cancel()
        tickerJob = viewModelScope.launch {
            while (true) {
                val elapsed = System.currentTimeMillis() - timer.startedAt
                val total = timer.durationMinutes * 60_000L
                val remaining = (total - elapsed).coerceAtLeast(0)
                remainingMillis.emit(remaining)
                if (remaining <= 0L) {
                    completeSession(timer)
                    break
                }
                delay(500L)
            }
        }
    }

    private suspend fun completeSession(timer: ActiveTimerEntity) {
        val earned = RewardCalculator.rewardForMinutes(timer.durationMinutes)
        val user = repository.getUser() ?: return
        repository.addSession(
            SessionEntity(
                id = UUID.randomUUID().toString(),
                type = timer.type,
                durationMinutes = timer.durationMinutes,
                startedAt = timer.startedAt,
                endedAt = System.currentTimeMillis(),
                earnedGold = earned
            )
        )
        repository.updateUser(user.copy(gold = user.gold + earned, xp = user.xp + earned))
        repository.clearTimer()
        completionGold.emit(earned)
        isCompleted.emit(true)
        lastCompletedDuration.emit(timer.durationMinutes)
        calmPhase.emit(true)
        delay(10_000L)
        calmPhase.emit(false)
    }

    private fun stopTicker() {
        tickerJob?.cancel()
        tickerJob = null
    }
}
