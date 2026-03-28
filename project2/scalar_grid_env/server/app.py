import os

import uvicorn
from openenv.core.env_server import create_app

from scalar_grid_env.models import GridAction, GridObservation
from scalar_grid_env.server.grid_environment import ScalarGridEnvironment

app = create_app(ScalarGridEnvironment, GridAction, GridObservation, env_name="scalar_grid_env")


def main() -> None:
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host=host, port=port, reload=False)

