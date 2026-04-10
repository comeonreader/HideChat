alter table im_message
    drop constraint if exists ck_im_message_message_type;

alter table im_message
    add constraint ck_im_message_message_type
        check (message_type in ('text', 'image', 'file', 'system'));
