const express = require("express");
const path = require("path");
const k8s = require("@kubernetes/client-node");
const cors = require("cors");
const { convertMinutesToReadable } = require("./utils");

const app = express();
const port = 3000;

app.use(cors("*"));

// Kubernetes config setup
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/clusters", async (req, res) => {
  const clusters = kc.getClusters();
  const currentCluster = kc.getCurrentCluster();

  const clusterMaps = clusters.map((cluster, index) => {
    return { name: cluster.name, server: cluster.server, index };
  });
  res.json({ clusters: clusterMaps, currentCluster: currentCluster });
});

app.get("/namespaces", async (req, res) => {
  try {
    const namespaceList = await k8sApi.listNamespace();
    const namespaces = namespaceList.body.items;
    const namespaceMaps = namespaces.map((namespace) => {
      return { name: namespace.metadata.name };
    });
    res.json(namespaceMaps);
  } catch (err) {
    console.error("Error fetching namespaces:", err);
    res.status(500).send("Error fetching namespaces");
  }
});

app.get("/pods/:namespace", async (req, res) => {
  const namespace = req.params.namespace;
  console.log("--------------", namespace);
  try {
    const podList = await k8sApi.listNamespacedPod(namespace);
    const pods = podList.body.items;

    const podMaps = pods.map((pod) => {
      // Calculate READY field
      const totalContainers = pod.status.containerStatuses.length;
      const readyContainers = pod.status.containerStatuses.filter(
        (status) => status.ready
      ).length;

      // Get STATUS field
      const status = pod.status.phase;

      console.log("STATUS", pod);

      // Calculate RESTARTS field and get the last restart time
      const restarts = pod.status.containerStatuses.reduce(
        (acc, container) => acc + container.restartCount,
        0
      );

      // Get the last restart time for each container
      const lastRestartTimes = pod.status.containerStatuses.map((container) => {
        const lastState = container.lastState.terminated;
        return lastState ? lastState.finishedAt : "Never Restarted";
      });

      // Calculate AGE field
      const creationTimestamp = new Date(pod.metadata.creationTimestamp);
      const currentTime = new Date();
      const ageInMilliseconds = currentTime - creationTimestamp;
      const ageInMinutes = Math.floor(ageInMilliseconds / 1000 / 60);

      return {
        name: pod.metadata.name,
        ready: `${readyContainers}/${totalContainers}`,
        status: status,
        restarts: restarts,
        lastRestartTimes:
          lastRestartTimes.length > 0 ? lastRestartTimes : ["Never Restarted"],
        age: convertMinutesToReadable(ageInMilliseconds),
      };
    });

    res.json({ pods: podMaps });
  } catch (err) {
    console.error("Error fetching pods:", err);
    res.status(500).send("Error fetching pods");
  }
});

// Route to check logs of a pod
app.get("/logs/:namespace/:podName", async (req, res) => {
  const namespace = req.params.namespace;
  const podName = req.params.podName;

  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    const podLogs = await k8sApi.readNamespacedPodLog(podName, namespace);

    // Set headers to prompt a file download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${podName}-logs.txt`
    );
    res.setHeader("Content-Type", "text/plain");

    // Send the log data as the response
    res.send(podLogs.body);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).send("Error fetching logs");
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
