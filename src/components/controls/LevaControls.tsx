import { useControls, folder } from "leva";
import { useSimulationStore } from "../../store/simulationStore";
import { useEffect } from "react";

export default function LevaControls() {
  const {
    setSpeed,
    setTrailThickness,
    setTrailLength,
  } = useSimulationStore();

  // Setup single dropdown behavior
  useEffect(() => {
    const handleFolderClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const folderElement = target.closest(".leva-c_folder__root");

      // Only handle clicks within Leva controls area, don't interfere with navigation
      if (folderElement && target.closest(".leva-c_panel")) {
        // Close all other folders
        const allFolders = document.querySelectorAll(".leva-c_folder__root");
        allFolders.forEach((folder) => {
          if (folder !== folderElement) {
            folder.classList.add("collapsed");
          }
        });
      }
    };

    // Add event listener after a short delay to ensure Leva is rendered
    const timer = setTimeout(() => {
      document.addEventListener("click", handleFolderClick);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleFolderClick);
    };
  }, []);

  const { speed, trailThickness, trailLength } = useControls({
    Simulation: folder({
      speed: { value: 1, min: 0.1, max: 20, step: 0.1, label: "Speed" },
    }),
    Trails: folder({
      trailThickness: {
        value: 0.005,
        min: 0.001,
        max: 0.05,
        step: 0.001,
        label: "Thickness",
      },
      trailLength: {
        value: 0.2,
        min: 0.0,
        max: 1.0,
        step: 0.05,
        label: "Length",
      },
    }),
  });

  useEffect(() => {
    setSpeed(speed);
  }, [speed, setSpeed]);

  useEffect(() => {
    setTrailThickness(trailThickness);
  }, [trailThickness, setTrailThickness]);

  useEffect(() => {
    setTrailLength(trailLength);
  }, [trailLength, setTrailLength]);

  return null;
}
