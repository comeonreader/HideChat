package com.hidechat.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);

    @Query(nativeQuery = true, value = """
            select * from users
            where lower(username) like :prefix escape '\\'
               or nickname ilike :contains escape '\\'
            order by id limit :limit""")
    List<User> searchByUsernameOrNickname(@Param("prefix") String prefix,
                                          @Param("contains") String contains,
                                          @Param("limit") int limit);
}
