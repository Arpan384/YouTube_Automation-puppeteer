module.exports = [
    {
        title: "video1",
        description: "first video",
        forChildren: false,
        path: "./videos/abc.mp4",
        visibility: "public",
    },
    {
        title: "upload 2",
        description: "second video",
        forChildren: false,
        path: "./videos/pqr.mp4",
        visibility: "private",
    },
    {
        title: "video _ 3",
        description: "third video",
        forChildren: true,
        path: "./videos/xyz.mp4",
        visibility: "unlisted",
    }
]