package com.hidechat.common.base;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import java.io.Serial;
import java.io.Serializable;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public abstract class BaseIdEntity implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.INPUT)
    private Long id;
}
