package com.c102.picky.domain.usersettings.repository;

import com.c102.picky.domain.usersettings.entity.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSettingsRepository extends JpaRepository<UserSettings, Long> {}
