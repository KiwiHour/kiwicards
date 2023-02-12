
var mockDirectoryTree = {
    UId: "root",
    name: "root",
    type: "root",
    children: [
        { UId: "y1", name: "Year 1", type: "folder", children: [
                { UId: "as1", name: "Semester 1", type: "folder", children: [
                        { UId: "ac1", name: "COM1001", type: "deck", children: [{ UId: "c5c1", name: "What is COM1005?", type: "card", lastCorrect: new Date(), daysTillAsk: 1, front: "What is COM1005?", back: "Pure pain" }] },
                        { UId: "ac3", name: "COM1003", type: "deck", children: [] },
                    ] },
                { UId: "as2", name: "Semester 2", type: "folder", children: [
                        { UId: "abc5", name: "COM1005", type: "deck", children: [
                                { UId: "c5c1", name: "What is COM1005?", type: "card", lastCorrect: new Date(), daysTillAsk: 1, front: "What is COM1005?", back: "Pure pain" },
                            ] },
                    ] },
            ] },
        { UId: "y2", name: "Year 2", type: "folder", children: [
                { UId: "bs1", name: "Semester 1", type: "folder", children: [] },
                { UId: "bs2", name: "Semester 2", type: "folder", children: [
                        { UId: "ac1", name: "COM1001", type: "deck", children: [] },
                        { UId: "ac3", name: "COM1003", type: "deck", children: [] },
                    ] }
            ] }
    ]
};
// finds topmost deck (first node in each level)
var currentNode = mockDirectoryTree;
while (currentNode.type !== "deck" && currentNode.children.length > 0) {
    currentNode = currentNode.children[0];
}
console.log(currentNode);
var x = mockDirectoryTree.children[0].children[0];
if (x.type == "folder") {
    x.children;
}
