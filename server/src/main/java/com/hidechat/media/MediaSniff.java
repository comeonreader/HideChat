package com.hidechat.media;

/** 文件魔数识别（设计 8.1：不信任扩展名） */
public final class MediaSniff {
    private MediaSniff() {}

    public enum Type { IMAGE_JPG, IMAGE_PNG, IMAGE_WEBP, IMAGE_GIF, MP4, WEBM, OGG }

    public static Type sniff(byte[] h) {
        if (h.length >= 3 && (h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8 && (h[2] & 0xFF) == 0xFF) return Type.IMAGE_JPG;
        if (h.length >= 4 && (h[0] & 0xFF) == 0x89 && h[1] == 0x50 && h[2] == 0x4E && h[3] == 0x47) return Type.IMAGE_PNG;
        if (h.length >= 12 && h[0] == 0x52 && h[1] == 0x49 && h[2] == 0x46 && h[3] == 0x46
                && h[8] == 0x57 && h[9] == 0x45 && h[10] == 0x42 && h[11] == 0x50) return Type.IMAGE_WEBP;
        if (h.length >= 4 && h[0] == 0x47 && h[1] == 0x49 && h[2] == 0x46 && h[3] == 0x38) return Type.IMAGE_GIF;
        if (h.length >= 8 && h[4] == 0x66 && h[5] == 0x74 && h[6] == 0x79 && h[7] == 0x70) return Type.MP4;
        if (h.length >= 4 && (h[0] & 0xFF) == 0x1A && (h[1] & 0xFF) == 0x45 && (h[2] & 0xFF) == 0xDF && (h[3] & 0xFF) == 0xA3) return Type.WEBM;
        if (h.length >= 4 && h[0] == 0x4F && h[1] == 0x67 && h[2] == 0x67 && h[3] == 0x53) return Type.OGG;
        return null;
    }

    public static String extOf(Type t) {
        return switch (t) {
            case IMAGE_JPG -> "jpg";
            case IMAGE_PNG -> "png";
            case IMAGE_WEBP -> "webp";
            case IMAGE_GIF -> "gif";
            case MP4 -> "mp4";
            case WEBM -> "webm";
            case OGG -> "ogg";
        };
    }
}
