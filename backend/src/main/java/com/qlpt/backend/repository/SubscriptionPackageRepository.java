package com.qlpt.backend.repository;

import com.qlpt.backend.entity.SubscriptionPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubscriptionPackageRepository extends JpaRepository<SubscriptionPackage, UUID> {
    List<SubscriptionPackage> findByActiveTrueOrderByMonthsAsc();
    List<SubscriptionPackage> findAllByOrderByMonthsAsc();
}
