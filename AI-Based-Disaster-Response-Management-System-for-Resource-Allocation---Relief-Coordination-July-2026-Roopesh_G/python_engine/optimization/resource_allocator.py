from ortools.linear_solver import pywraplp

class ResourceAllocator:
    def __init__(self):
        pass

    def optimize_allocation(self, resources: list, zones: list):
        """
        Optimizes allocation of resources to zones using OR-Tools MIP solver.
        Objective: Maximize severity met, minimize distance/cost.
        
        resources: list of dicts [{'id': 'r1', 'quantity': 100, 'type': 'Food', 'location': 'Warehouse A'}]
        zones: list of dicts [{'id': 'z1', 'demand': 50, 'severity_score': 85, 'type': 'Food'}]
        """
        solver = pywraplp.Solver.CreateSolver('SCIP')
        if not solver:
            return {"error": "Solver not found."}

        # For simplicity in this implementation, we will match resources and zones by 'type'
        assignments = {}
        
        # Organize demands by type
        zones_by_type = {}
        for z in zones:
            rtype = z.get('type')
            if rtype not in zones_by_type:
                zones_by_type[rtype] = []
            zones_by_type[rtype].append(z)
            
        allocations = []
        
        for rtype, r_zones in zones_by_type.items():
            avail_resources = [r for r in resources if r.get('type') == rtype]
            
            # Variables: x[i][j] = amount of resource i sent to zone j
            x = {}
            for i, res in enumerate(avail_resources):
                for j, zone in enumerate(r_zones):
                    # Max we can send is either total available or total demanded
                    max_alloc = min(res['quantity'], zone['demand'])
                    x[i, j] = solver.IntVar(0, max_alloc, f'x_{i}_{j}')

            # Constraint 1: Supply constraints
            for i, res in enumerate(avail_resources):
                solver.Add(sum(x[i, j] for j in range(len(r_zones))) <= res['quantity'])

            # Constraint 2: Demand constraints (don't over-supply a zone)
            for j, zone in enumerate(r_zones):
                solver.Add(sum(x[i, j] for i in range(len(avail_resources))) <= zone['demand'])

            # Objective: Maximize (severity_score * allocated_amount)
            # This ensures highest severity zones get resources first
            objective = solver.Objective()
            for i, res in enumerate(avail_resources):
                for j, zone in enumerate(r_zones):
                    # Weight by severity score
                    weight = zone.get('severity_score', 1.0)
                    objective.SetCoefficient(x[i, j], weight)
                    
            objective.SetMaximization()

            status = solver.Solve()

            if status == pywraplp.Solver.OPTIMAL or status == pywraplp.Solver.FEASIBLE:
                for i, res in enumerate(avail_resources):
                    for j, zone in enumerate(r_zones):
                        allocated_amt = x[i, j].solution_value()
                        if allocated_amt > 0:
                            allocations.append({
                                'resource_id': res['id'],
                                'zone_id': zone['id'],
                                'resource_type': rtype,
                                'allocated_quantity': int(allocated_amt)
                            })
                            
        return {"allocations": allocations}

allocator = ResourceAllocator()
